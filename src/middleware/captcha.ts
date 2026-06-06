import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

interface HCaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  score?: number;
  'error-codes'?: string[];
}

async function verifyHCaptcha(token: string): Promise<boolean> {
  const body = new URLSearchParams({
    secret: env.HCAPTCHA_SECRET_KEY,
    response: token,
  });

  const res = await fetch(env.HCAPTCHA_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = (await res.json()) as HCaptchaResponse;
  return data.success === true;
}

// Middleware: wajib ada captchaToken di body untuk endpoint sensitif.
// Di-skip otomatis jika CAPTCHA_ENABLED=false (development).
export function requireCaptcha(req: Request, res: Response, next: NextFunction): void {
  if (!env.CAPTCHA_ENABLED) {
    next();
    return;
  }

  const token = req.body?.captchaToken as string | undefined;

  if (!token) {
    res.status(400).json({
      success: false,
      message: 'CAPTCHA wajib diselesaikan',
      code: 'CAPTCHA_MISSING',
    });
    return;
  }

  verifyHCaptcha(token)
    .then(valid => {
      if (!valid) {
        res.status(400).json({
          success: false,
          message: 'CAPTCHA tidak valid atau sudah kadaluarsa',
          code: 'CAPTCHA_INVALID',
        });
        return;
      }
      next();
    })
    .catch(err => {
      // Jika hCaptcha API tidak bisa dihubungi, jangan block user (fail-open)
      console.error('[CAPTCHA] Gagal verifikasi:', err);
      next();
    });
}
