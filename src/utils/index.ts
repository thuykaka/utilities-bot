import logger from './logger';
import Request from './request';

type RetryWrapperConfig<T> = {
  fn: () => Promise<T>;
  validateFn: (result?: T) => Promise<boolean>;
  onRetryCallback?: (result?: T) => Promise<void>;
  maxRetries?: number;
  delay?: number;
  debug?: boolean;
};

class Utils {
  public static sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public static async retryWrapper<T>(cfg: RetryWrapperConfig<T>): Promise<T | undefined> {
    const { fn, validateFn, onRetryCallback, maxRetries = 3, delay = 1000, debug = true } = cfg;

    let attempt = 0;
    let shouldContinue = true;
    let response: T | undefined;

    do {
      let fnResponse;

      try {
        fnResponse = await fn();
      } catch (err: any) {
        debug && logger.error(`retryWrapper - ${fn.name} failed, error: ${err.stack}`);
      }

      debug && logger.info(`retryWrapper - ${fn.name} response: ${typeof fnResponse === 'object' ? JSON.stringify(fnResponse) : fnResponse}`);

      if (await validateFn(fnResponse)) {
        shouldContinue = false;
        response = fnResponse;
      } else {
        attempt++;
        await Utils.sleep(delay);
        if (onRetryCallback) await onRetryCallback();
        debug && logger.info(`retryWrapper - ${fn.name} retry ${attempt}/${maxRetries}`);
        shouldContinue = attempt < maxRetries;
      }
    } while (shouldContinue);
    return response;
  }

  public static getCookieValue(cookies: string | string[], cookieName: string): string | undefined {
    if (!cookies) return undefined;

    const cookiesArray = Array.isArray(cookies) ? cookies : [cookies];
    const cookiePrefix = `${cookieName}=`;

    for (const cookie of cookiesArray) {
      if (typeof cookie !== 'string') continue;

      const cookiePair = cookie.split(';')[0];
      if (cookiePair?.startsWith(cookiePrefix)) {
        return cookiePair;
      }
    }

    return undefined;
  }
}

export { logger as Logger, Request, Utils };
