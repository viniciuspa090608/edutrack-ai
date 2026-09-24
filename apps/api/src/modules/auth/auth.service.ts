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

  async register(
    input: RegisterRequest,
    ip: string,
    previousToken?: string,
  ): Promise<{ user: PublicUser; token: string }> {
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
      const user = await this.users.createLocal(input.email, hash, salt);
      const token = await this.sessions.create(user.id, previousToken);
      return { user: await this.publicUser(user.id), token };
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
  ): Promise<{ user: PublicUser; token: string }> {
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
    const token = await this.sessions.create(stored.userId, previousToken);
    return { user: await this.publicUser(stored.userId), token };
  }
}
