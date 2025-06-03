import axios, { type AxiosInstance, type ResponseType } from 'axios';
import { nanoid } from 'nanoid';
import curlirize from 'axios-curlirize';
import { Logger } from '.';

type RequestConfig = {
  url: string;
  method?: string;
  headers?: Record<string, unknown>;
  data?: string | Record<string, unknown>;
  timeout?: number;
  responseType?: ResponseType;
  keepRawResponse?: boolean;
  reqId?: string;
  logResponse?: boolean;
};

export default class Request {
  private axiosInstance: AxiosInstance;

  constructor(private readonly baseUrl: string, private readonly headers: Record<string, unknown> = {}, private readonly isDebug: boolean = true) {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: this.headers,
    });

    if (this.isDebug) {
      curlirize(this.axiosInstance, (req: any, error: any) => {
        const { command } = req;
        const reqId = req?.object?.request?.headers?.['x-custom-req-id'];
        if (error) {
          Logger.error(error, `reqId_${reqId} error: ${error.stack}`);
        } else {
          Logger.info(`reqId_${reqId}, ${command}`);
        }
      });
    }
  }

  async send<T>(req: RequestConfig): Promise<T | null> {
    const { url, method = 'GET', headers, data, timeout = 10000, responseType = 'json', keepRawResponse = false, logResponse = false, reqId = nanoid() } = req;
    try {
      const response = await this.axiosInstance({
        url,
        method,
        headers: {
          'x-custom-req-id': reqId,
          ...headers,
        },
        timeout,
        responseType,
        ...(data ? (method === 'GET' ? { params: data } : { data }) : {}),
      });

      const results = keepRawResponse ? response : response.data;

      this.isDebug && Logger.info(`reqId_${reqId} done${logResponse ? `, data: ${JSON.stringify(results)}` : ''}`);

      return results as T;
    } catch (error: any) {
      this.isDebug && Logger.error(`reqId_${reqId} error: ${error.stack}`);
      return null;
    }
  }
}
