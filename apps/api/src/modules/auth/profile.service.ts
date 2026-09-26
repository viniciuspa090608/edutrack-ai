import type { AuthService } from './auth.service.js';
import { ProfileRepository, lockAvailableEmail } from './profile.repository.js';
import type { ActiveSession } from './session.repository.js';
import { hashPassword, verifyPassword } from './password.js';
import { HttpError } from '../../shared/http-error.js';

export class ProfileService {
  readonly repository: ProfileRepository;
  constructor(private readonly auth: AuthService) {
    this.repository = new ProfileRepository(auth.users.source);
  }
  read(userId: string) {
    return this.repository.read(userId);
  }
  async updateName(userId: string, name: string) {
    await this.repository.name(userId, name);
    return this.read(userId);
  }
  avatar(userId: string) {
    return this.repository.avatar(userId);
  }
  async saveAvatar(userId: string, bytes: Buffer | null) {
    await this.repository.saveAvatar(userId, bytes);
    return this.read(userId);
  }
  private async checkAttempts(userId: string, ip: string): Promise<void> {
    await this.auth.rateLimits.cleanup();
    if (
      (await this.auth.rateLimits.blocked(
        'profile-password',
        'user',
        userId,
        5,
      )) ||
      (await this.auth.rateLimits.blocked('profile-password', 'ip', ip, 20))
    )
      throw new HttpError(
        429,
        'TOO_MANY_ATTEMPTS',
        'Muitas tentativas. Tente novamente mais tarde.',
      );
  }
  private async wrongPassword(userId: string, ip: string): Promise<never> {
    await Promise.all([
      this.auth.rateLimits.record('profile-password', 'user', userId),
      this.auth.rateLimits.record('profile-password', 'ip', ip),
    ]);
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Senha atual inválida.');
  }
  async provePassword(
    session: ActiveSession,
    password: string,
    ip = 'unknown',
  ): Promise<void> {
    await this.checkAttempts(session.userId, ip);
    const user = await this.repository.read(session.userId);
    const stored = await this.auth.users.passwordByEmail(user.email);
    if (!stored || !(await verifyPassword(password, stored)))
      return this.wrongPassword(session.userId, ip);
    await this.repository.source.transaction(async (manager) => {
      await this.repository.lockUser(manager, session.userId);
      await this.repository.requireActiveSession(manager, session);
      if (
        !(await this.repository.matchesPassword(
          manager,
          session.userId,
          stored.hash,
        ))
      )
        throw new HttpError(
          401,
          'IDENTITY_PROOF_REQUIRED',
          'Confirme sua identidade novamente.',
        );
      await this.repository.prove(session, manager);
    });
  }
  async requestEmail(
    session: ActiveSession,
    email: string,
    ip: string,
  ): Promise<void> {
    await this.repository.source.transaction(async (manager) => {
      await this.repository.lockUser(manager, session.userId);
      await this.repository.requireProof(session, manager);
      await lockAvailableEmail(manager, email, session.userId);
      if (
        (await this.repository.currentEmail(manager, session.userId)) === email
      )
        throw new HttpError(
          400,
          'INVALID_INPUT',
          'Informe um e-mail diferente do atual.',
        );
      await this.auth.email.issue(
        session.userId,
        email,
        'change_email',
        ip,
        manager,
      );
      await this.repository.reserveEmail(manager, session.userId, email);
      await this.repository.consumeProof(manager, session.id);
    });
  }
  async resend(session: ActiveSession, ip: string): Promise<void> {
    await this.repository.source.transaction(async (manager) => {
      await this.repository.lockUser(manager, session.userId);
      await this.repository.requireActiveSession(manager, session);
      const email = await this.repository.reservation(manager, session.userId);
      await this.auth.email.issue(
        session.userId,
        email,
        'change_email',
        ip,
        manager,
      );
      await this.repository.reserveEmail(manager, session.userId, email);
    });
  }
  async confirm(session: ActiveSession, code: string): Promise<void> {
    await this.auth.email.consume(
      session.userId,
      'change_email',
      code,
      async (manager) => {
        await this.repository.requireActiveSession(manager, session);
        const email = await this.repository.reservation(
          manager,
          session.userId,
        );
        await lockAvailableEmail(manager, email, session.userId);
        const old = await this.repository.currentEmail(manager, session.userId);
        await this.repository.setEmail(manager, session.userId, email);
        await this.repository.invalidate(manager, session.userId);
        await this.auth.email.notifyChanged(manager, session.userId, old);
      },
    );
  }
  async changePassword(
    session: ActiveSession,
    currentPassword: string,
    password: string,
    ip = 'unknown',
  ): Promise<void> {
    await this.checkAttempts(session.userId, ip);
    const user = await this.repository.read(session.userId);
    const stored = await this.auth.users.passwordByEmail(user.email);
    if (!stored)
      throw new HttpError(
        409,
        'NO_LOCAL_PASSWORD',
        'Gerencie sua senha na conta Google.',
      );
    if (!(await verifyPassword(currentPassword, stored)))
      return this.wrongPassword(session.userId, ip);
    const next = await hashPassword(password);
    await this.repository.source.transaction(async (manager) => {
      await this.repository.lockUser(manager, session.userId);
      await this.repository.requireActiveSession(manager, session);
      await this.repository.setPassword(
        manager,
        session.userId,
        stored.hash,
        next,
      );
      await this.repository.invalidate(manager, session.userId);
    });
  }
}
