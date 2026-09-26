import type {
  AuthUser as PublicUser,
  LoginRequest,
  RegisterRequest,
} from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';
import { AuthRepository, isDuplicateKey } from './auth.repository.js';
import { hashPassword, verifyPassword } from './password.js';
import { RateLimitRepository } from './rate-limit.repository.js';
import { SessionRepository } from './session.repository.js';
import { EmailRepository } from './email.repository.js';

const INVALID_CREDENTIALS = new HttpError(
  401,
  'INVALID_CREDENTIALS',
  'E-mail ou senha inválidos.',
);
const RATE_LIMITED = new HttpError(
  429,
  'TOO_MANY_ATTEMPTS',
  'Muitas tentativas. Tente novamente mais tarde.',
);

export class AuthService {
  constructor(
    readonly users: AuthRepository,
    readonly sessions: SessionRepository,
    readonly rateLimits: RateLimitRepository,
    readonly email: EmailRepository,
  ) {}

  async publicUser(userId: string): Promise<PublicUser> {
    const user = await this.users.userById(userId);
    if (!user)
      throw new HttpError(401, 'UNAUTHENTICATED', 'Entre para continuar.');
    return {
      id: user.id,
      email: user.email,
      googleLinked: await this.users.hasGoogle(user.id),
    };
  }

  private async verificationUser(token?: string): Promise<string> {
    const userId = token ? await this.email.contextUser(token) : null;
    if (!userId)
      throw new HttpError(
        401,
        'UNAUTHENTICATED',
        'Entre novamente para confirmar seu e-mail.',
      );
    return userId;
  }

  async resendConfirmation(
    token: string | undefined,
    ip: string,
  ): Promise<void> {
    const userId = await this.verificationUser(token);
    const user = await this.users.userById(userId);
    if (!user || (await this.users.isEmailVerified(userId)))
      throw new HttpError(
        409,
        'ALREADY_VERIFIED',
        'Este e-mail já foi confirmado.',
      );
    await this.email.issue(user.id, user.email, 'verify_email', ip);
  }

  async limitEmailValidation(
    purpose: 'verify_email' | 'reset_password',
    ip: string,
  ): Promise<void> {
    await this.email.limitValidation(purpose, ip);
  }

  async confirmEmail(token: string | undefined, code: string): Promise<void> {
    await this.email.consume(
      await this.verificationUser(token),
      'verify_email',
      code,
    );
  }

  async requestRecovery(email: string, ip: string): Promise<void> {
    const stored = await this.users.passwordByEmail(email);
    await this.email.issue(stored?.userId ?? null, email, 'reset_password', ip);
  }

  async verifyRecovery(email: string, code: string): Promise<string> {
    const stored = await this.users.passwordByEmail(email);
    if (!stored)
      throw new HttpError(400, 'INVALID_CODE', 'Código inválido ou expirado.');
    const grant = await this.email.consume(
      stored.userId,
      'reset_password',
      code,
    );
    if (!grant)
      throw new HttpError(400, 'INVALID_CODE', 'Código inválido ou expirado.');
    return grant;
  }

  async resetPassword(
    token: string | undefined,
    password: string,
  ): Promise<void> {
    if (!token)
      throw new HttpError(
        401,
        'INVALID_RESET_GRANT',
        'Solicite um novo código.',
      );
    const { hash, salt } = await hashPassword(password);
    await this.email.reset(token, hash, salt);
  }

  async register(
    input: RegisterRequest,
    ip: string,
    previousToken?: string,
  ): Promise<{ kind: 'pending'; verificationToken: string }> {
    await this.rateLimits.cleanup();
    if (
      (await this.rateLimits.blocked('register', 'ip', ip, 10)) ||
      (await this.rateLimits.blocked('register', 'email', input.email, 5))
    )
      throw RATE_LIMITED;
    await Promise.all([
      this.rateLimits.record('register', 'ip', ip),
      this.rateLimits.record('register', 'email', input.email),
    ]);
    const { hash, salt } = await hashPassword(input.password);
    try {
      return await this.users.source.transaction(async (manager) => {
        const user = await this.users.createLocal(
          input.email,
          hash,
          salt,
          manager,
        );
        await this.email.issue(
          user.id,
          user.email,
          'verify_email',
          ip,
          manager,
        );
        const verificationToken = await this.email.context(user.id, manager);
        if (previousToken) await this.sessions.revoke(previousToken, manager);
        return { kind: 'pending' as const, verificationToken };
      });
    } catch (error) {
      if (isDuplicateKey(error))
        throw new HttpError(
          409,
          'EMAIL_UNAVAILABLE',
          'Não foi possível usar este e-mail.',
        );
      throw error;
    }
  }

  async login(
    input: LoginRequest,
    ip: string,
    previousToken?: string,
  ): Promise<
    | { kind: 'active'; user: PublicUser; token: string }
    | { kind: 'pending'; verificationToken: string }
  > {
    await this.rateLimits.cleanup();
    if (
      (await this.rateLimits.blocked('login', 'ip', ip, 20)) ||
      (await this.rateLimits.blocked('login', 'email', input.email, 5))
    )
      throw RATE_LIMITED;
    const stored = await this.users.passwordByEmail(input.email);
    if (!(await verifyPassword(input.password, stored))) {
      await Promise.all([
        this.rateLimits.record('login', 'ip', ip),
        this.rateLimits.record('login', 'email', input.email),
      ]);
      throw INVALID_CREDENTIALS;
    }
    if (!stored) throw INVALID_CREDENTIALS;
    if (!(await this.users.isEmailVerified(stored.userId))) {
      if (previousToken) await this.sessions.revoke(previousToken);
      return {
        kind: 'pending',
        verificationToken: await this.email.context(stored.userId),
      };
    }
    const token = await this.sessions.create(
      stored.userId,
      previousToken,
      stored.hash,
    );
    return {
      kind: 'active',
      user: await this.publicUser(stored.userId),
      token,
    };
  }
}
