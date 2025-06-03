import { z } from 'zod';
import qs from 'qs';
import { createWorker } from 'tesseract.js';
import { parse } from 'node-html-parser';
import Logger from '../logger';
import Request from '../request';
import Utils from '../../utils';
import { config, PARSE_FINES_URL_RESPONSE_DATA_KEYS } from './config';
import type { VehicleType, ResolverCaptchaResponse, GetFinesUrlResponse, ParseFinesUrlResponse, ParseFinesUrlResponseData, CheckResponse } from './types';

const PhatNguoiSchema = z.object({
  plate: z.string().min(1, 'Plate is required').max(10, 'Plate must be at most 10 characters'),
  vehicleType: z.enum(['1', '2']).optional(),
});

type PhatNguoiRequest = z.infer<typeof PhatNguoiSchema>;

class PhatNguoi {
  private request: Request;
  private worker?: Awaited<ReturnType<typeof createWorker>>;

  constructor(private readonly isDebug: boolean = true) {
    this.request = new Request(config.baseUrl, config.headers, this.isDebug);
  }

  private async initWorker() {
    if (!this.worker) {
      this.worker = await createWorker('eng');
      Logger.info('Worker initialized');
    }
  }

  private async ensureWorker() {
    if (!this.worker) {
      await this.initWorker();
    }
  }

  private cleanPlate(plate: string): string {
    return plate.replace(/[^a-z0-9]/gi, '');
  }

  private detectVehicleType(plate: string): VehicleType {
    return plate.length === 8 ? '1' : /^\d{2}(LD|DA)\d{4,6}$/.test(plate) ? '1' : '2';
  }

  private isValidCaptcha(captcha: string): boolean {
    return !!captcha && captcha.length === 6;
  }

  private cleanCaptcha(captcha: string): string {
    return captcha
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '');
  }

  private isValidFinesUrl(url: string): boolean {
    return !!url && url.startsWith(config.baseUrl);
  }

  private async resolverCaptcha(): Promise<ResolverCaptchaResponse> {
    const response = await this.request.send<{ headers: { 'set-cookie'?: string[] }; data: Buffer }>({
      url: config.captchaUrl,
      responseType: 'arraybuffer',
      keepRawResponse: true,
    });

    if (!response) return {};

    const sessionId = Utils.getCookieValue(response.headers['set-cookie'] || [], 'PHPSESSID');

    let captcha = response.data;

    if (!captcha) return {};

    captcha = Buffer.from(captcha);

    await this.ensureWorker();

    const ret = await this.worker?.recognize(captcha);

    return { sessionId, captcha: this.cleanCaptcha(ret?.data?.text || '') };
  }

  private async resolverCaptchaRetry() {
    return Utils.retryWrapper<ResolverCaptchaResponse>({
      fn: () => this.resolverCaptcha(),
      validateFn: async ({ sessionId, captcha } = {}) => !!sessionId && typeof captcha === 'string' && this.isValidCaptcha(captcha),
      maxRetries: config.maxRetries,
    });
  }

  private async getFinesUrl(cfg: PhatNguoiRequest): Promise<GetFinesUrlResponse> {
    const result = await this.resolverCaptchaRetry();
    if (!result) return {};

    const { sessionId, captcha } = result;
    const response = await this.request.send<{ href?: string }>({
      url: config.finesUrl,
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        cookie: sessionId,
      },
      data: qs.stringify({
        BienKS: cfg.plate,
        Xe: cfg.vehicleType,
        captcha,
        ipClient: '9.9.9.91',
        cUrl: '1',
      }),
      logResponse: true,
    });

    return { url: response?.href, sessionId };
  }

  private async getFinesUrlRetry(cfg: PhatNguoiRequest) {
    return Utils.retryWrapper<GetFinesUrlResponse>({
      fn: () => this.getFinesUrl(cfg),
      validateFn: async ({ url, sessionId } = {}) => !!sessionId && !!url && this.isValidFinesUrl(url),
      maxRetries: config.maxRetries,
    });
  }

  private async parseFinesUrl(url: string, sessionId: string): Promise<ParseFinesUrlResponse> {
    const pageContent = await this.request.send<string>({ url: url, headers: { cookie: sessionId } });
    if (!pageContent) return { retry: true, data: [] };

    const root = parse(pageContent);
    const wrapper = root.querySelector('#bodyPrint123');

    if (!wrapper) return { retry: true, data: [] };

    if (wrapper?.innerText?.trim()?.toLowerCase().includes('Không tìm thấy kết quả'.toLowerCase())) return { retry: false, data: [] };

    const separateEl = '<hr style="margin-bottom: 25px;">';

    const wrappers = wrapper.innerHTML?.split(separateEl)?.filter(i => !!i.trim());

    if (!wrappers) return { retry: true, data: [] };

    let data: ParseFinesUrlResponseData[] = [];

    for (let wrapper of wrappers) {
      let dom = parse(wrapper);
      let allElements = Array.from(dom.querySelectorAll('.form-group'));
      if (!allElements) continue;

      let item = {} as ParseFinesUrlResponseData;
      for (let [idx, element] of allElements.entries()) {
        const label = element.querySelector('.col-md-3')?.innerText?.trim();
        const value = element.querySelector('.col-md-9')?.innerText?.trim();

        if (!value && label) continue;

        if (value && PARSE_FINES_URL_RESPONSE_DATA_KEYS[idx]) {
          item[PARSE_FINES_URL_RESPONSE_DATA_KEYS[idx]] = value;
        } else {
          item['resolvingUnit'] ||= [];
          item['resolvingUnit'].push(element?.innerText?.trim());
        }
      }

      data.push(item);
    }

    return { retry: data.length === 0 && wrappers.length > 0, data };
  }

  private async parseFinesUrlRetry(url: string, sessionId: string) {
    return Utils.retryWrapper<ParseFinesUrlResponse>({
      fn: () => this.parseFinesUrl(url, sessionId),
      validateFn: async ({ retry } = { retry: true, data: [] }) => !retry,
      maxRetries: config.maxRetries,
    });
  }

  async check(cfg: PhatNguoiRequest, format: 'html' | 'json' = 'html'): Promise<CheckResponse | string> {
    PhatNguoiSchema.parse(cfg);

    const plate = this.cleanPlate(cfg.plate);
    const vehicleType = cfg.vehicleType ?? this.detectVehicleType(plate);

    const result = await this.getFinesUrlRetry({ plate, vehicleType });
    if (!result || !result.url || !result.sessionId)
      return {
        error: true,
        message: 'Can not get fines url or session id',
      };

    const finesData = await this.parseFinesUrlRetry(result.url, result.sessionId);
    if (!finesData)
      return {
        error: true,
        message: 'Can not get fines data',
      };

    const jsonResponse = { error: false, data: finesData.data };

    if (format === 'json') return jsonResponse;

    return this.toHtml(plate, jsonResponse);
  }

  private toHtml(plate: string, jsonResponse: CheckResponse): string {
    if (jsonResponse.error || !jsonResponse.data)
      return `Xin lỗi, hiện tại tôi không thể kiểm tra thông tin vi phạm giao thông cho biển số xe ${plate}. Bạn có thể thử lại sau hoặc cung cấp một biển số khác để tôi kiểm tra.`;

    if (jsonResponse.data.length === 0)
      return `Biển số xe ${plate} không có vi phạm nào được ghi nhận. Nếu bạn cần kiểm tra thêm thông tin về biển số khác, hãy cho tôi biết!`;

    const result = jsonResponse.data.map((item, idx) => {
      return `
- Lỗi ${idx + 1}:
  - Thời gian vi phạm: ${item.violationTime}
  - Địa điểm: ${item.location}
  - Loại vi phạm: ${item.violationType}
  - Trạng thái: ${item.status}
  - Đơn vị phát hiện: ${item.detectingUnit}
  - Đơn vị giải quyết: ${item.resolvingUnit?.join(', ')}
`;
    });
    return `Biển số xe ${plate} có ${jsonResponse.data.length} vi phạm giao thông.${result.join('\n')}`;
  }
}

export default PhatNguoi;
const phatNguoi = new PhatNguoi();

Logger.info(`${await phatNguoi.check({ plate: '37LD00097' })}`);
