import type { PARSE_FINES_URL_RESPONSE_DATA_KEYS } from './config';

export type VehicleType = '1' | '2';

export type ResolverCaptchaResponse = {
  sessionId?: string;
  captcha?: string;
};

export type GetFinesUrlResponse = {
  url?: string;
  sessionId?: string;
};

export type ParseFinesUrlResponseDataKey = (typeof PARSE_FINES_URL_RESPONSE_DATA_KEYS)[number];

export type ParseFinesUrlResponseData = {
  [K in ParseFinesUrlResponseDataKey]: string;
} & {
  resolvingUnit?: string[];
};

export type ParseFinesUrlResponse = {
  retry: boolean;
  data: ParseFinesUrlResponseData[];
};

export type CheckResponse = {
  error: boolean;
  message?: string;
  data?: ParseFinesUrlResponseData[];
};
