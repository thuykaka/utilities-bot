import TeleBot from './libs/tele-bot';
import { Utils } from './utils';

const botToken = process.env.TELEGRAM_BOT_TOKEN!;
const botProxy = process.env.TELEGRAM_BOT_PROXY!;
const botAdminIds = Utils.parseStringEnvToArrayNumber(process.env.TELEGRAM_BOT_ADMINS);

new TeleBot(botToken, botProxy, botAdminIds);
