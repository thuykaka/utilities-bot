import qrcode from 'qrcode';
import speakeasy from 'speakeasy';

export class TOTP {
  static generateSecret(name?: string, issuer?: string) {
    return speakeasy.generateSecret({ length: 20, name, issuer });
  }

  static generateQRCode(secret: string) {
    return qrcode.toDataURL(secret);
  }

  static generate(secret: string, step?: number) {
    return speakeasy.totp({ secret, encoding: 'base32', step: step });
  }

  static verify(secret: string, token: string) {
    return speakeasy.totp.verify({ secret, token, encoding: 'base32' });
  }
}
