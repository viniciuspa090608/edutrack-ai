import nodemailer from 'nodemailer';
import type { ApiEnv } from '../../config/env.js';
import type { EmailPurpose } from './email-crypto.js';

export function createSmtpSender(env: ApiEnv) {
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_FROM)
    throw new Error('Email delivery is not configured');
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    requireTLS: env.NODE_ENV === 'production' && env.SMTP_PORT !== 465,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 60_000,
    ...(env.SMTP_USER && env.SMTP_PASSWORD
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }
      : {}),
  });
  return async (
    email: string,
    code: string,
    purpose: EmailPurpose,
  ): Promise<void> => {
    const recovery = purpose === 'reset_password';
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: recovery
        ? 'Código para redefinir sua senha na EduTrack'
        : 'Confirme seu e-mail na EduTrack',
      text: recovery
        ? `Seu código para redefinir a senha é ${code}. Ele vale por 10 minutos após o envio. Se você não solicitou a redefinição, ignore este e-mail.`
        : `Seu código de confirmação da EduTrack é ${code}. Ele vale por 10 minutos após o envio. Se você não criou a conta, ignore este e-mail.`,
    });
  };
}
