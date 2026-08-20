import { TOTP } from 'otplib';
import QRCode from 'qrcode';
import { db } from '@/lib/db';

// Compatibility shim for otplib v2+ (authenticator was removed)
const authenticator = {
  generateSecret: () => {
    const totp = new TOTP({ step: 30, digits: 6 });
    return totp.generateSecret();
  },
  keyuri: (user: string, service: string, secret: string) => {
    return `otpauth://totp/${encodeURIComponent(service)}:${encodeURIComponent(user)}?secret=${secret}&issuer=${encodeURIComponent(service)}`;
  },
  verify: ({ token, secret }: { token: string; secret: string }) => {
    const totp = new TOTP({ secret, step: 30, digits: 6 });
    return totp.verify({ token, secret });
  },
};

export class MfaService {
  /**
   * Generates a TOTP secret and QR code for a user
   */
  static async setupTotp(userId: string, email: string) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, 'iSCARB', secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      secret,
      qrCodeUrl,
    };
  }

  /**
   * Verifies the TOTP code and if successful, saves the MFA setting to the user
   */
  static async verifyAndEnableTotp(userId: string, secret: string, token: string) {
    const isValid = authenticator.verify({ token, secret });

    if (!isValid) {
      throw new Error('Invalid MFA token');
    }

    // Save MFA settings in the database (upsert to handle existing disabled records)
    await db.mfaSettings.upsert({
      where: { userId },
      update: {
        totpSecret: secret,
        enabled: true,
        method: 'totp',
      },
      create: {
        userId,
        totpSecret: secret,
        enabled: true,
        method: 'totp',
      },
    });

    return true;
  }

  /**
   * Verifies a standard login TOTP
   */
  static async verifyTotp(userId: string, token: string) {
    const settings = await db.mfaSettings.findUnique({
      where: { userId },
    });

    if (!settings || !settings.enabled || !settings.totpSecret) {
      throw new Error('MFA is not enabled for this user');
    }

    const isValid = authenticator.verify({
      token,
      secret: settings.totpSecret,
    });

    if (!isValid) {
      throw new Error('Invalid MFA token');
    }

    return true;
  }
}
