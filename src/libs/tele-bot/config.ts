export const GUIDE = {
  help: (user?: string) => `
Hello *${user || 'mem'} 🐶*

I'm a bot that can help you with available commands:

[/help](/help) - Guide you to use the bot
[/restart](/restart) - Restart the bot (only for admin)
[/2fa](/2fa) - Generate 2FA code from secret key
[/bankqr](/bankqr) - Generate bank QR code
[/phatnguoi](/phatnguoi) - Kiểm tra phạt nguội từ csgt.vn
[/ssh](/ssh) - SSH to remote server
[/cancel](/cancel) - Cancel current operation
`,
  restart: `Only admin can restart the bot`,
  restartAdmin: `Restarting...\nPlease wait a moment...`,
  _2fa: `Enter the secret key to generate 2FA code`,
  phatnguoi: `Vui lòng nhập biển số xe để kiểm tra phạt nguội từ csgt.vn`,
  bankqr: `Nhập theo cú pháp BANK\\_ACCOUNT BANK\\_BIN(or BANK\\_NAME) AMOUNT DESCRIPTION (max 50 characters)`,
  ssh1: `Enter the command to connect to remote server: ssh user@ip -p password -port port`,
  ssh2: `Enter the command to execute on remote server: $ command (example: $ ls), enter the command to disconnect: $ exit`,
};
