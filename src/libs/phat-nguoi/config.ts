export const config = {
  baseUrl: 'https://www.csgt.vn',
  captchaUrl: '/lib/captcha/captcha.class.php',
  finesUrl: '/?mod=contact&task=tracuu_post&ajax',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'content-type': 'text/html; charset=UTF-8',
  },
  maxRetries: 5,
};

export const PARSE_FINES_URL_RESPONSE_DATA_KEYS = [
  'plate',
  'plateColor',
  'vehicleType',
  'violationTime',
  'location',
  'violationType',
  'status',
  'detectingUnit',
] as const;
