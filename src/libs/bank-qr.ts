import qrcode, { type QRCodeToBufferOptions, type QRCodeToDataURLOptions } from 'qrcode';
import { z } from 'zod';
import { Jimp } from 'jimp';

type PointOfInitMethod = 'static' | 'dynamic';

type QrCodeLogoOptions = {
  src: string;
  text?: string;
  backgroundColor?: string;
  size?: {
    w?: number;
    h?: number;
  };
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
};

// Zod schema for validation
const VietQrSchema = z.object({
  bankBin: z
    .string()
    .min(1, 'Bank BIN or name is required')
    .refine(val => /^[0-9]{6}$/.test(val) || Object.keys(BANK_BINS).includes(val.toLowerCase()), {
      message: 'Invalid bank BIN code or bank name',
    }),
  accNo: z
    .string()
    .min(1, 'Account number is required')
    .max(19, 'Account number must be at most 19 digits')
    .regex(/^[0-9]+$/, 'Account number must contain only digits'),
  amt: z
    .string()
    .min(1, 'Amount is required')
    .max(13, 'Amount must be at most 13 digits')
    .regex(/^[0-9]+$/, 'Amount must contain only digits')
    .refine(val => parseInt(val) > 0, {
      message: 'Amount must be a positive number',
    }),
  desc: z
    .string()
    .min(1, 'Description is required')
    .max(50, 'Description must be at most 50 characters')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Description must contain only letters, numbers and spaces')
    .transform(val => val.trim())
    .refine(val => val.length <= 50, {
      message: 'Description must be at most 50 characters after trimming',
    }),
  initMethod: z.enum(['static', 'dynamic']).optional(),
});

type VietQrConfig = z.infer<typeof VietQrSchema>;

// Bank BIN codes mapping
const BANK_BINS: Record<string, string> = {
  // Ngân hàng TMCP Sài Gòn Công Thương
  saigonbank: '970400',
  sgb: '970400',
  'ngan hang sai gon cong thuong': '970400',

  // Ngân hàng TMCP Sài Gòn Thương Tín
  sacombank: '970403',
  stb: '970403',
  'ngan hang sai gon thuong tin': '970403',

  // Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam
  agribank: '970405',
  'ngan hang nong nghiep va phat trien nong thon viet nam': '970405',

  // Ngân hàng TMCP Đông Á
  dongabank: '970406',
  'ngan hang dong a': '970406',

  // Ngân hàng TMCP Kỹ Thương Việt Nam
  techcombank: '970407',
  tcb: '970407',
  'ngan hang ky thuong viet nam': '970407',

  // Ngân hàng TNHH Một Thành Viên Dầu Khí Toàn Cầu
  gpbank: '970408',
  'ngan hang dau khi toan cau': '970408',

  // Ngân hàng TMCP Bắc Á
  bab: '970409',
  'ngan hang bac a': '970409',

  // Ngân hàng TNHH Một Thành Viên Standard Chartered
  stanchart: '970410',
  scvn: '970410',
  'ngan hang standard chartered viet nam': '970410',

  // Ngân hàng TMCP Đại Chúng Việt Nam
  pvcombank: '970412',
  'ngan hang dai chung viet nam': '970412',

  // Ngân hàng TNHH Một Thành Viên Đại Dương
  oceanbank: '970414',
  ocean: '970414',

  // Ngân hàng TMCP Công Thương Việt Nam
  vietinbank: '970415',
  'ngan hang cong thuong viet nam': '970415',

  // Ngân hàng TMCP Á Châu
  acb: '970416',
  'ngan hang a chau': '970416',

  // Ngân hàng Đầu tư và Phát triển Việt Nam
  bidv: '970418',
  'ngan hang dau tu va phat trien viet nam': '970418',

  // Ngân hàng TMCP Quốc Dân
  ncb: '970419',
  'ngan hang quoc dan': '970419',

  // Ngân hàng Liên doanh Việt Nga
  vrb: '970421',
  'ngan hang lien doanh viet nga': '970421',

  // Ngân hàng TMCP Quân Đội
  mb: '970422',
  'ngan hang quan doi': '970422',

  // Ngân hàng TMCP Tiên Phong
  tpbank: '970423',
  'ngan hang tien phong': '970423',

  // Ngân hàng TNHH Một Thành Viên Shinhan Việt Nam
  shinhan: '970424',
  'ngan hang shinhan viet nam': '970424',

  // Ngân hàng TMCP An Bình
  abbank: '970425',
  'ngan hang an binh': '970425',

  // Ngân hàng TMCP Hàng Hải
  msb: '970426',
  'ngan hang hang hai': '970426',

  // Ngân hàng TMCP Việt Á
  vietabank: '970427',
  'ngan hang viet a': '970427',

  // Ngân hàng TMCP Nam Á
  nama: '970428',
  'ngan hang nam a': '970428',

  // Ngân hàng TMCP Xăng dầu Petrolimex
  pgbank: '970430',
  'ngan hang thinh vuong va phat trien': '970430',

  // Ngân hàng TMCP Xuất Nhập khẩu Việt Nam
  eximbank: '970431',
  'ngan hang xuat nhap khau viet nam': '970431',

  // Ngân hàng TMCP Việt Nam Thịnh Vượng
  vpbank: '970432',
  'ngan hang viet nam thinh vuong': '970432',

  // Ngân hàng TMCP Việt Nam Thương Tín
  vietbank: '970433',
  'ngan hang viet nam thuong tin': '970433',

  // Ngân hàng TNHH Indovina
  indovina: '970434',
  'ngan hang indovina': '970434',

  // Ngân hàng TMCP Ngoại thương Việt Nam
  vietcombank: '970436',
  vcb: '970436',
  'ngan hang ngoai thuong viet nam': '970436',

  // Ngân hàng TMCP Phát triển TP.HCM
  hdbank: '970437',
  'ngan hang phat trien tp hcm': '970437',

  // Ngân hàng TMCP Bảo Việt
  bvb: '970438',
  baovietbank: '970438',
  'ngan hang bao viet': '970438',

  // Ngân hàng TNHH Một Thành Viên Public Việt Nam
  publicbank: '970439',
  pbvn: '970439',
  'ngan hang public viet nam': '970439',

  // Ngân hàng TMCP Đông Nam Á
  seabank: '970440',
  'ngan hang dong nam a': '970440',

  // Ngân hàng TMCP Quốc Tế Việt Nam
  vib: '970441',
  'ngan hang quoc te viet nam': '970441',

  // Ngân hàng TNHH Một Thành Viên Hong Leong Việt Nam
  hongleong: '970442',
  hlbvn: '970442',
  'ngan hang hong leong viet nam': '970442',

  // Ngân hàng TMCP Sài Gòn - Hà Nội
  shb: '970443',
  'ngan hang sai gon ha noi': '970443',

  // Ngân hàng TNHH Một Thành Viên Xây Dựng Việt Nam
  cbbank: '970444',
  'ngan hang xay dung viet nam': '970444',

  // Ngân hàng Hợp Tác Xã Việt Nam
  coopbank: '970446',

  // Ngân hàng TMCP Phương Đông
  ocb: '970448',

  // Ngân hàng TMCP Kiên Long
  kienlong: '970452',
  klb: '970452',

  // Ngân hàng TMCP Bản Việt
  bvbank: '970454',

  // Ngân hàng Công nghiệp Hàn Quốc - Chi nhánh Hà Nội
  ibk_hanoi: '970455',

  // Ngân hàng Industrial Bank of Korea - Chi nhánh Hồ Chí Minh
  ibk_hcm: '970456',

  // Ngân hàng TNHH Một Thành Viên Woori Bank Việt Nam
  wooribank: '970457',

  // Ngân hàng TNHH Một Thành Viên UOB Việt Nam
  uob: '970458',

  // Ngân hàng TNHH Một Thành Viên CIMB Việt Nam
  cimb: '970459',
};

/**
 * Get bank BIN code from bank name
 * @param bankName - Bank name or code (case insensitive)
 * @returns Bank BIN code or undefined if not found
 */
function getBankBin(bankName: string): string | undefined {
  return BANK_BINS[bankName.toLowerCase()];
}

/**
 * Check if a string is a valid bank BIN code
 * @param bin - String to check
 * @returns boolean indicating if the string is a valid BIN code
 */
function isValidBin(bin: string): boolean {
  return /^[0-9]{6}$/.test(bin);
}

/**
 * Get bank BIN code from either bank name or direct BIN code
 * @param input - Bank name or BIN code
 * @returns Bank BIN code or undefined if not found
 * @throws Error if input is invalid
 */
function resolveBankBin(input: string): string {
  // If input is a valid BIN code, use it directly
  if (isValidBin(input)) return input;

  // Try to get BIN code from bank name
  const bin = getBankBin(input);
  if (bin) return bin;

  throw new Error(`Invalid bank name or BIN code: ${input}, refer: https://www.sbv.gov.vn/webcenter/portal/vi/menu/trangchu/ttvnq/htmtcqht`);
}

class VietQr {
  private static readonly PFI = '000210'; // PAYLOAD_FORMAT_INDICATOR
  private static readonly GUID = '0010A000000727';
  private static readonly SVC = '0208QRIBFTTA'; // SERVICE_CODE
  private static readonly CURR = '5303704'; // CURRENCY
  private static readonly CC = '5802VN'; // COUNTRY_CODE

  private readonly initMethod: string;
  private readonly accInfo: string;
  private readonly txAmt: string;
  private readonly addData: string;

  /**
   * Creates a new VietQR code generator instance
   * @param cfg Configuration object containing all required parameters
   * @param cfg.bankBin - Bank BIN code or bank name from https://www.sbv.gov.vn/webcenter/portal/vi/menu/trangchu/ttvnq/htmtcqht
   * @param cfg.accNo - Recipient's bank account number
   * @param cfg.amt - Transfer amount (positive number, max 13 digits)
   * @param cfg.desc - Transfer description (max 50 characters, no special characters)
   * @param cfg.initMethod - QR type: 'static' or 'dynamic'
   * @throws Error if validation fails
   */
  constructor(cfg: VietQrConfig) {
    // Validate input using Zod schema
    const validatedConfig = VietQrSchema.parse(cfg);

    const bankBin = resolveBankBin(validatedConfig.bankBin);
    this.initMethod = this.buildInitMethod(validatedConfig.initMethod);
    this.accInfo = this.buildAccInfo(bankBin, validatedConfig.accNo);
    this.txAmt = this.buildTxAmt(validatedConfig.amt);
    this.addData = this.buildAddData(validatedConfig.desc);
  }

  private static getSize(txt: string): string {
    return txt.length.toString().padStart(2, '0');
  }

  private buildInitMethod(method?: PointOfInitMethod): string {
    return method === 'static' ? '010211' : '010212';
  }

  private buildAccInfo(bin: string, acc: string): string {
    const binSize = VietQr.getSize(bin);
    const binPart = `00${binSize}${bin}`;

    const accSize = VietQr.getSize(acc);
    const accPart = `01${accSize}${acc}`;

    const org = `01${VietQr.getSize(`${binPart}${accPart}`)}${binPart}${accPart}`;
    const info = `${VietQr.GUID}${org}${VietQr.SVC}`;

    return `38${VietQr.getSize(info)}${info}`;
  }

  private buildTxAmt(amt: string): string {
    return `54${VietQr.getSize(amt)}${amt}`;
  }

  private buildAddData(desc: string): string {
    const val = `08${VietQr.getSize(desc)}${desc}`;
    return `62${VietQr.getSize(val)}${val}`;
  }

  private static calcCrc(txt: string): string {
    let crc = 0xffff;

    for (let i = 0; i < txt.length; i++) {
      crc ^= txt.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Generates the QR code string
   * @returns The complete QR code string
   */
  public getQrContent(): string {
    const content = [VietQr.PFI, this.initMethod, this.accInfo, VietQr.CURR, this.txAmt, VietQr.CC, this.addData, '6304'].join('');
    return `${content}${VietQr.calcCrc(content)}`;
  }

  public async getQrDataUrl(options: QRCodeToDataURLOptions): Promise<string> {
    return qrcode.toDataURL(this.getQrContent(), { width: 250, ...options });
  }

  public async getQrBuffer(options: QRCodeToBufferOptions): Promise<Buffer> {
    return qrcode.toBuffer(this.getQrContent(), { width: 250, ...options });
  }

  private detectUrlType(url: string): 'url' | 'base64' | undefined {
    if (/^data:image\/png;base64,/.test(url)) return 'base64';
    if (z.string().url().safeParse(url).success) return 'url';
    return undefined;
  }

  public async getQrWithLogo(qrCodeOptions: QRCodeToBufferOptions, logoOptions: QrCodeLogoOptions): Promise<string> {
    const qrImage = await Jimp.read(await qrcode.toBuffer(this.getQrContent(), { width: 250, ...qrCodeOptions }));

    const logoSrc = logoOptions.src;
    const logoType = this.detectUrlType(logoSrc);
    if (!logoType) throw new Error('Invalid logo source');

    const logoImage = await Jimp.read(logoType === 'url' ? logoSrc : Buffer.from(logoSrc.split(',')[1]!, 'base64'));
    const logoRatio = logoImage.bitmap.height / logoImage.bitmap.width;
    const logoWidth = Math.min(logoOptions.size?.w ?? qrImage.bitmap.width * 0.2, qrImage.bitmap.width * 0.2);
    const logoHeight = logoOptions.size?.h ?? Math.round(logoWidth * logoRatio);
    logoImage.resize({ w: logoWidth, h: logoHeight });

    // Center the logo in the QR code
    const x = qrImage.bitmap.width / 2 - logoWidth / 2;
    const y = qrImage.bitmap.height / 2 - logoHeight / 2;

    if (!logoOptions.backgroundColor) {
      qrImage.composite(logoImage, x, y);
    } else {
      const backgroundImage = new Jimp({ width: logoWidth, height: logoHeight, color: logoOptions.backgroundColor });
      backgroundImage.composite(logoImage, 0, 0);
      qrImage.composite(backgroundImage, x, y);
    }

    return qrImage.getBase64('image/png');
  }
}

export { VietQr, type VietQrConfig };
