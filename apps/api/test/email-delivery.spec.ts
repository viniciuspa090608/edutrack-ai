import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiEnv } from '../src/config/env.js';
import { createSmtpSender } from '../src/modules/auth/email-delivery.js';
import {
  EmailCrypto,
  type EmailPurpose,
} from '../src/modules/auth/email-crypto.js';
import { EmailRepository } from '../src/modules/auth/email.repository.js';
import type { DataSource } from 'typeorm';

const { sendMail } = vi.hoisted(() => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn(() => ({ sendMail })) },
}));
const env = {
  NODE_ENV: 'test',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: 587,
  SMTP_FROM: 'EduTrack <mail@example.com>',
} as ApiEnv;
const cases = [
  {
    subject: 'Confirme seu endereço de e-mail',
    text: 'Olá, Ana Ç,\n\nSeu cadastro foi realizado com sucesso.\n\nPara confirmar seu endereço de e-mail e ativar sua conta, utilize o código abaixo:\n\n001234\n\nEsse código é válido por 10 minutos.\n\nVolte para a plataforma e informe o código no campo de confirmação para concluir seu cadastro.\n\nSe você não realizou esse cadastro, ignore este e-mail.\n\nPor segurança, não compartilhe este código com ninguém.\n\nAtenciosamente,\nEquipe EduTrack\n\nEste é um e-mail automático. Por favor, não responda.',
    purpose: 'verify_email',
    resend: false,
  },
  {
    subject: 'Novo código de confirmação',
    text: 'Olá, Ana Ç,\n\nVocê solicitou um novo código para confirmar seu endereço de e-mail.\n\nUse o código abaixo para continuar:\n\n001234\n\nEsse código é válido por 10 minutos.\n\nO código de confirmação enviado anteriormente não é mais válido.\n\nVolte para a plataforma e informe o novo código no campo de confirmação.\n\nSe você não solicitou um novo código, ignore este e-mail.\n\nPor segurança, não compartilhe este código com ninguém.\n\nAtenciosamente,\nEquipe EduTrack\n\nEste é um e-mail automático. Por favor, não responda.',
    purpose: 'verify_email',
    resend: true,
  },
  {
    subject: 'Código para redefinição de senha',
    text: 'Olá, Ana Ç,\n\nRecebemos uma solicitação para redefinir a senha da sua conta.\n\nUse o código abaixo para continuar o processo:\n\n001234\n\nEsse código é válido por 10 minutos.\n\nVolte para a plataforma, informe o código e escolha uma nova senha.\n\nSe você não solicitou a redefinição de senha, ignore este e-mail. Sua senha atual continuará funcionando normalmente.\n\nPor segurança, não compartilhe este código com ninguém.\n\nAtenciosamente,\nEquipe EduTrack\n\nEste é um e-mail automático. Por favor, não responda.',
    purpose: 'reset_password',
    resend: false,
  },
  {
    subject: 'Confirme seu novo endereço de e-mail',
    text: 'Olá, Ana Ç,\n\nRecebemos uma solicitação para alterar o endereço de e-mail associado à sua conta para este endereço.\n\nPara confirmar a alteração, utilize o código abaixo:\n\n001234\n\nEsse código é válido por 10 minutos.\n\nVolte para a plataforma e informe o código no campo de confirmação para concluir a alteração.\n\nSe você não reconhece essa solicitação, não utilize o código e ignore este e-mail.\n\nPor segurança, não compartilhe este código com ninguém.\n\nAtenciosamente,\nEquipe EduTrack\n\nEste é um e-mail automático. Por favor, não responda.',
    purpose: 'change_email',
    resend: false,
  },
  {
    subject: 'O e-mail da sua conta foi alterado',
    text: 'Olá, Ana Ç,\n\nO endereço de e-mail associado à sua conta foi alterado com sucesso.\n\nNovo endereço: novo@example.com\n\nComo medida de segurança, as sessões anteriormente conectadas à sua conta foram encerradas.\n\nPara continuar utilizando a plataforma, será necessário entrar novamente usando seu novo endereço de e-mail.\n\nSe você realizou essa alteração, nenhuma ação adicional é necessária.\n\nSe você não reconhece essa alteração, entre em contato com o suporte o mais rápido possível para proteger sua conta.\n\nAtenciosamente,\nEquipe EduTrack\n\nEste é um e-mail automático. Por favor, não responda.',
    purpose: 'email_changed',
    resend: false,
  },
];

describe('transactional email content', () => {
  beforeEach(() => sendMail.mockClear());
  it.each(cases)(
    'renders $subject with complete interpolated content',
    async (fixture) => {
      await createSmtpSender(env)(
        'anterior@example.com',
        '001234',
        fixture.purpose as EmailPurpose,
        {
          displayName: 'Ana Ç',
          newEmail: 'novo@example.com',
          resend: fixture.resend,
        },
      );
      expect(sendMail).toHaveBeenCalledExactlyOnceWith({
        from: env.SMTP_FROM,
        to: 'anterior@example.com',
        subject: fixture.subject,
        text: fixture.text,
      });
      expect(fixture.text).not.toMatch(/undefined|null|\{\{.*?\}\}/);
    },
  );
  it('uses the same content for an email change resend', async () => {
    const send = createSmtpSender(env);
    await send('novo@example.com', '001234', 'change_email', {
      displayName: 'Ana Ç',
      resend: true,
    });
    expect(sendMail.mock.calls[0]![0].text).toBe(cases[3]!.text);
    expect(sendMail.mock.calls[0]![0].subject).toBe(cases[3]!.subject);
  });
  it.each(['verify_email', 'email_changed'] as const)(
    'enriches legacy %s presentation without changing delivery inputs',
    async (purpose) => {
      // Only presentation fixtures; no database, authentication or API flow is exercised.
      const query = vi
        .fn()
        .mockResolvedValue([
          { display_name: 'Ana Ç', email: 'novo@example.com' },
        ]);
      const crypto = new EmailCrypto('01'.repeat(32), '02'.repeat(32));
      const repository = new EmailRepository(
        { query } as unknown as DataSource,
        crypto,
      );
      const encrypted = crypto.encrypt({
        email: 'anterior@example.com',
        code: '001234',
        purpose,
      });
      vi.spyOn(repository, 'reserve').mockResolvedValue({
        ...encrypted,
        id: 'outbox',
        challenge_id: 'challenge',
        purpose,
        attempts: 1,
        challenge_state: 'queued',
        lease_token: 'lease',
        auth_tag: encrypted.tag,
      });
      vi.spyOn(repository, 'finishDelivery').mockResolvedValue(undefined);
      await repository.deliverOne(createSmtpSender(env));
      const expected = cases[purpose === 'email_changed' ? 4 : 0]!;
      expect(sendMail.mock.calls[0]![0]).toMatchObject({
        to: 'anterior@example.com',
        subject: expected.subject,
        text: expected.text,
      });
    },
  );
  it('forwards captured presentation without replacing it with current account data', async () => {
    const query = vi.fn();
    const crypto = new EmailCrypto('01'.repeat(32), '02'.repeat(32));
    const repository = new EmailRepository(
      { query } as unknown as DataSource,
      crypto,
    );
    const encrypted = crypto.encrypt({
      email: 'anterior@example.com',
      code: '001234',
      purpose: 'verify_email',
      presentation: { displayName: 'Ana Ç', resend: true },
    });
    vi.spyOn(repository, 'reserve').mockResolvedValue({
      ...encrypted,
      id: 'outbox',
      challenge_id: 'challenge',
      purpose: 'verify_email',
      attempts: 1,
      challenge_state: 'queued',
      lease_token: 'lease',
      auth_tag: encrypted.tag,
    });
    vi.spyOn(repository, 'finishDelivery').mockResolvedValue(undefined);
    await repository.deliverOne(createSmtpSender(env));
    expect(query).not.toHaveBeenCalled();
    expect(sendMail.mock.calls[0]![0].text).toBe(cases[1]!.text);
    expect(sendMail.mock.calls[0]![0].subject).toBe(cases[1]!.subject);
  });
});
