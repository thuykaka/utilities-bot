import qrcode from 'qrcode';
import speakeasy from 'speakeasy';

export class TOTP {
  constructor(private secret: string) {
    this.secret = secret;
  }

  generateSecret(name?: string, issuer?: string) {
    return speakeasy.generateSecret({ length: 20, name, issuer });
  }

  generateQRCode(secret: string) {
    return qrcode.toDataURL(secret);
  }

  generate(step?: number) {
    return speakeasy.totp({ secret: this.secret, encoding: 'base32', step: step });
  }

  verify(token: string) {
    return speakeasy.totp.verify({ secret: this.secret, token, encoding: 'base32' });
  }
}
