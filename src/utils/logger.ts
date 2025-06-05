import { Signale } from 'signale';

class AbstractLogger {
  private readonly loggerInstance: Signale;

  constructor(private readonly sv: string, private readonly color: boolean = false) {
    this.loggerInstance = new Signale({
      scope: this.sv,
    });
  }

  public info(message: string, ...args: any[]) {
    this.loggerInstance.info(message, ...args);
  }

  public error(obj: unknown, msg?: string, ...args: any[]) {
    this.loggerInstance.error(obj, msg, ...args);
  }

  public warn(message: string, ...args: any[]) {
    this.loggerInstance.warn(message, ...args);
  }

  public debug(message: string, ...args: any[]) {
    this.loggerInstance.debug(message, ...args);
  }
}

const Logger = new AbstractLogger('application');

export default Logger;
