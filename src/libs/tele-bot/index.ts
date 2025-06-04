import TelegramBot from 'node-telegram-bot-api';
import { GUIDE } from './config';
import { Logger } from '../../utils';
import { TOTP } from '../2fa-otp';
import PhatNguoi from '../phat-nguoi';
import { VietQr } from '../bank-qr';

type UserAction = '2fa' | 'bankqr' | 'phatnguoi' | 'ssh';

class TeleBot {
  private bot: TelegramBot;
  private phatNguoi: PhatNguoi;
  private mapUserAction: Map<number, UserAction> = new Map();

  private readonly BOT_MENUS: TelegramBot.BotCommand[] = [
    { command: 'help', description: 'Help' },
    { command: '2fa', description: 'Generate 2FA code from secret key' },
    { command: 'bankqr', description: 'Generate bank QR code' },
    { command: 'phatnguoi', description: 'Kiểm tra phạt nguội từ csgt.vn' },
    { command: 'ssh', description: 'SSH to remote server' },
    { command: 'restart', description: 'Restart bot' },
    { command: 'cancel', description: 'Cancel current operation' },
  ];

  constructor(private readonly token: string, private readonly proxy: string, private readonly adminIds: number[]) {
    this.bot = new TelegramBot(this.token, {
      polling: true,
      ...(this.proxy && {
        baseApiUrl: this.proxy,
      }),
    });
    this.phatNguoi = new PhatNguoi();
    this.adminIds = this.adminIds;
    this.setMenu();
    this.setMessageHandler();
  }

  private async setMenu() {
    const result = await this.bot.setMyCommands(this.BOT_MENUS);
    Logger.info(`Set menu result: ${result}`);
  }

  private getUserSenderId(msg: TelegramBot.Message) {
    return msg.from?.id!;
  }

  private async sendHelpMessage(msg: TelegramBot.Message) {
    await this.bot.sendMessage(msg.chat.id, GUIDE.help(msg.from?.username), { parse_mode: 'Markdown' });
  }

  private async sendRestartMessage(msg: TelegramBot.Message) {
    const userId = this.getUserSenderId(msg);
    if (userId && this.adminIds.includes(userId)) {
      await this.bot.sendMessage(msg.chat.id, GUIDE.restartAdmin, { parse_mode: 'Markdown' });
      process.exit(1);
    } else {
      this.bot.sendMessage(msg.chat.id, GUIDE.restart, { parse_mode: 'Markdown' });
    }
  }

  private async send2faMessage(msg: TelegramBot.Message) {
    await this.bot.sendMessage(msg.chat.id, GUIDE._2fa, { parse_mode: 'Markdown' });
    const userId = this.getUserSenderId(msg);
    this.mapUserAction.set(userId, '2fa');
  }

  private async sendPhatNguoiMessage(msg: TelegramBot.Message) {
    await this.bot.sendMessage(msg.chat.id, GUIDE.phatnguoi, { parse_mode: 'Markdown' });
    const userId = this.getUserSenderId(msg);
    this.mapUserAction.set(userId, 'phatnguoi');
  }

  private async sendBankQrMessage(msg: TelegramBot.Message) {
    await this.bot.sendMessage(msg.chat.id, GUIDE.bankqr, { parse_mode: 'Markdown' });
    const userId = this.getUserSenderId(msg);
    this.mapUserAction.set(userId, 'bankqr');
  }

  private async handleUserAction(msg: TelegramBot.Message) {
    const text = msg.text;
    Logger.info(`handleUserAction - text: ${text}`);

    if (!text) return;

    if (this.BOT_MENUS.some(m => `/${m.command}` === text)) return;

    const userId = this.getUserSenderId(msg);
    const action = this.mapUserAction.get(userId);

    if (!action) {
      await this.sendHelpMessage(msg);
      return;
    }

    Logger.info(`handleUserAction - action: ${action}`);

    switch (action) {
      case '2fa':
        const code = TOTP.generate(text);
        await this.bot.sendMessage(msg.chat.id, `2FA code: ${code}`);
        break;
      case 'phatnguoi':
        const result = (await this.phatNguoi.check({ plate: text })) as string;
        await this.bot.sendMessage(msg.chat.id, result, { parse_mode: 'HTML' });
        break;
      case 'bankqr':
        const [accNo, bankBin, amt, ...descArr] = text.split(' ') as [string, string, string, string];
        const desc = descArr.join(' ');
        try {
          const bankQR = new VietQr({ bankBin, accNo, amt, desc });
          const qrDataUrl = await bankQR.getQrBuffer({});
          await this.bot.sendPhoto(msg.chat.id, qrDataUrl, {}, { filename: `Qr-${accNo}-${bankBin}-${amt}-${desc}`, contentType: 'image/png' });
        } catch (error: any) {
          await this.bot.sendMessage(msg.chat.id, `Error generating bank QR code`);
        }
        break;
      default:
        break;
    }
  }

  private setMessageHandler() {
    this.bot.onText(/\/help$/, async msg => {
      await this.sendHelpMessage(msg);
    });

    this.bot.onText(/\/restart$/, async msg => {
      await this.sendRestartMessage(msg);
    });

    this.bot.onText(/\/2fa$/, async msg => {
      await this.send2faMessage(msg);
    });

    this.bot.onText(/\/phatnguoi$/, async msg => {
      await this.sendPhatNguoiMessage(msg);
    });

    this.bot.onText(/\/bankqr$/, async msg => {
      await this.sendBankQrMessage(msg);
    });

    this.bot.onText(/\/cancel$/, async msg => {
      const userId = this.getUserSenderId(msg);
      if (this.mapUserAction.has(userId)) {
        this.mapUserAction.delete(userId);
        await this.bot.sendMessage(msg.chat.id, `The command newbot has been cancelled. Anything else I can do for you?\nSend /help for a list of commands.`, {
          parse_mode: 'Markdown',
        });
      } else {
        await this.bot.sendMessage(msg.chat.id, `No active command to cancel. I wasn't doing anything anyway. Zzzzz...`);
      }
    });

    this.bot.on('message', async msg => {
      await this.handleUserAction(msg);
    });
  }
}

export default TeleBot;
