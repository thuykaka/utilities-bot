export const GUIDE = {
  hello: (user?: string) => `
Hello *${user || 'mem'} 🐶*

I'm a bot that can help you with your pet's health.

*Available Commands:*

1. \`/hello\` - Guide you to use the bot
2. \`/restart\` - Restart the bot
3. \`/2fa\` - Generate 2FA code from secret key
4. \`/bankqr\` - Generate bank QR code from: bank account, bank bin (or bank name), amount, description
5. \`/phatnguoi\` - Check phat-nguoi from [csgt.vn](https://csgt.vn)
6. \`/ssh\` - SSH to remote server
  `,
  restart: `
Restarting...
Please wait a moment...
  `,
  _2fa: `Use \`/2fa secret\` to generate 2FA code from secret key
  `,
  phatnguoi: `Use \`/phatnguoi bien_so\` to check phat-nguoi from csgt.vn
  `,
  bankqr: `Use \`/bankqr bank_account bank_bin amount description (max 50 characters)\` to generate bank QR code`,
};
