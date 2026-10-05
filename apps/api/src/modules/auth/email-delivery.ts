import nodemailer from 'nodemailer';
import type { ApiEnv } from '../../config/env.js';
import type { EmailPurpose, EmailPresentation } from './email-crypto.js';

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
    presentation: EmailPresentation = {},
  ): Promise<void> => {
    const recovery = purpose === 'reset_password';
    if (purpose === 'email_changed') {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject: 'O e-mail da sua conta foi alterado',
        text: `Olá, ${presentation.displayName ?? 'Estudante'},

O endereço de e-mail associado à sua conta foi alterado com sucesso.

Novo endereço: ${presentation.newEmail ?? ''}

Como medida de segurança, as sessões anteriormente conectadas à sua conta foram encerradas.

Para continuar utilizando a plataforma, será necessário entrar novamente usando seu novo endereço de e-mail.

Se você realizou essa alteração, nenhuma ação adicional é necessária.

Se você não reconhece essa alteração, entre em contato com o suporte o mais rápido possível para proteger sua conta.

Atenciosamente,
Equipe EduTrack

Este é um e-mail automático. Por favor, não responda.`,
      });
      return;
    }
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: recovery
        ? 'Código para redefinição de senha'
        : purpose === 'change_email'
          ? 'Confirme seu novo endereço de e-mail'
          : presentation.resend
            ? 'Novo código de confirmação'
            : 'Confirme seu endereço de e-mail',
      text: recovery
        ? `Olá, ${presentation.displayName ?? 'Estudante'},

Recebemos uma solicitação para redefinir a senha da sua conta.

Use o código abaixo para continuar o processo:

${code}

Esse código é válido por 10 minutos.

Volte para a plataforma, informe o código e escolha uma nova senha.

Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha atual continuará funcionando normalmente.

Por segurança, não compartilhe este código com ninguém.

Atenciosamente,
Equipe EduTrack

Este é um e-mail automático. Por favor, não responda.`
        : purpose === 'change_email'
          ? `Olá, ${presentation.displayName ?? 'Estudante'},

Recebemos uma solicitação para alterar o endereço de e-mail associado à sua conta para este endereço.

Para confirmar a alteração, utilize o código abaixo:

${code}

Esse código é válido por 10 minutos.

Volte para a plataforma e informe o código no campo de confirmação para concluir a alteração.

Se você não reconhece essa solicitação, não utilize o código e ignore este e-mail.

Por segurança, não compartilhe este código com ninguém.

Atenciosamente,
Equipe EduTrack

Este é um e-mail automático. Por favor, não responda.`
          : presentation.resend
            ? `Olá, ${presentation.displayName ?? 'Estudante'},

Você solicitou um novo código para confirmar seu endereço de e-mail.

Use o código abaixo para continuar:

${code}

Esse código é válido por 10 minutos.

O código de confirmação enviado anteriormente não é mais válido.

Volte para a plataforma e informe o novo código no campo de confirmação.

Se você não solicitou um novo código, ignore este e-mail.

Por segurança, não compartilhe este código com ninguém.

Atenciosamente,
Equipe EduTrack

Este é um e-mail automático. Por favor, não responda.`
            : `Olá, ${presentation.displayName ?? 'Estudante'},

Seu cadastro foi realizado com sucesso.

Para confirmar seu endereço de e-mail e ativar sua conta, utilize o código abaixo:

${code}

Esse código é válido por 10 minutos.

Volte para a plataforma e informe o código no campo de confirmação para concluir seu cadastro.

Se você não realizou esse cadastro, ignore este e-mail.

Por segurança, não compartilhe este código com ninguém.

Atenciosamente,
Equipe EduTrack

Este é um e-mail automático. Por favor, não responda.`,
    });
  };
}
