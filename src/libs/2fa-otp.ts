import qrcode from 'qrcode';
import speakeasy from 'speakeasy';
import { Utils } from '../utils';

export class TOTP {
  static generateSecret(name?: string, issuer?: string) {
    return speakeasy.generateSecret({ length: 20, name, issuer });
  }

  static generateQRCode(secret: string) {
    secret = Utils.removeStringSpaces(secret);
    return qrcode.toDataURL(secret);
  }

  static generate(secret: string, step?: number) {
    secret = Utils.removeStringSpaces(secret);
    return speakeasy.totp({ secret, encoding: 'base32', step: step });
  }

  static verify(secret: string, token: string) {
    secret = Utils.removeStringSpaces(secret);
    return speakeasy.totp.verify({ secret, token, encoding: 'base32' });
  }
}
