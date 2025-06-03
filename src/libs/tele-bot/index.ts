import TelegramBot from 'node-telegram-bot-api';
import { GUIDE } from './config';
import { Logger } from '../../utils';
import { TOTP } from '../2fa-otp';
import PhatNguoi from '../phat-nguoi';
import { VietQr } from '../bank-qr';

class TeleBot {
  private bot: TelegramBot;
  private phatNguoi: PhatNguoi;

  constructor(private readonly token: string) {
    this.bot = new TelegramBot(this.token, {
      polling: true,
      baseApiUrl: 'https://telegram.thuyka.workers.dev',
    });
    this.phatNguoi = new PhatNguoi();
    this.setMenu();
    this.setMessageHandler();
  }

  private async setMenu() {
    const result = await this.bot.setMyCommands([
      { command: 'hello', description: 'Hello 🐶' },
      { command: 'restart', description: 'Restart bot' },
      { command: '2fa', description: 'Generate 2FA code from secret key' },
      { command: 'bankqr', description: 'Generate bank QR code from: bank account, bank bin (or bank name), amount, description' },
      { command: 'phatnguoi', description: 'Check phat-nguoi from csgt.vn' },
      { command: 'ssh', description: 'SSH to remote server' },
    ]);
    Logger.info(`Set menu result: ${result}`);
  }

  private setMessageHandler() {
    this.bot.onText(/\/hello$/, msg => {
      this.bot.sendMessage(msg.chat.id, GUIDE.hello(msg.from?.username), { parse_mode: 'Markdown' });
    });

    this.bot.onText(/\/restart$/, msg => {
      this.bot.sendMessage(msg.chat.id, GUIDE.restart, { parse_mode: 'Markdown' });
    });

    this.bot.onText(/\/2fa$/, msg => {
      this.bot.sendMessage(msg.chat.id, GUIDE._2fa, { parse_mode: 'Markdown' });
    });

    this.bot.onText(/\/2fa (.+)/, (msg, match) => {
      const secret = match![1]!;
      const code = TOTP.generate(secret);
      this.bot.sendMessage(msg.chat.id, `2FA code: ${code}`);
    });

    this.bot.onText(/\/phatnguoi$/, msg => {
      this.bot.sendMessage(msg.chat.id, GUIDE.phatnguoi, { parse_mode: 'Markdown' });
    });

    this.bot.onText(/\/phatnguoi (.+)/, async (msg, match) => {
      Logger.info(`phatnguoi: ${match![1]!}`);
      const plate = match![1]!;
      const result = (await this.phatNguoi.check({ plate })) as string;
      this.bot.sendMessage(msg.chat.id, result, { parse_mode: 'HTML' });
    });

    this.bot.onText(/\/bankqr$/, msg => {
      this.bot.sendMessage(msg.chat.id, GUIDE.bankqr, { parse_mode: 'Markdown' });
    });

    this.bot.onText(/\/bankqr (.+)/, async (msg, match) => {
      Logger.info(`bankqr: ${match![1]!}`);
      const [accNo, bankBin, amt, ...desc] = match![1]!.split(' ') as [string, string, string, string];
      const bankQR = new VietQr({ bankBin, accNo, amt, desc: desc.join(' ') });
      const qrDataUrl = await bankQR.getQrBuffer({});

      const fileOptions: TelegramBot.FileOptions = {
        filename: `Qr-${accNo}-${bankBin}-${amt}-${desc.join(' ')}`,
        contentType: 'image/png',
      };

      this.bot.sendPhoto(msg.chat.id, qrDataUrl, {}, fileOptions);
    });
  }
}

export default TeleBot;
