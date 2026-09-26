import { CreateProfilePreferences20260926160000 } from '../src/database/migrations/20260926160000-CreateProfilePreferences.js';
import { randomBytes } from 'node:crypto';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { CreateAuthentication20260924221500 } from '../src/database/migrations/20260924221500-CreateAuthentication.js';
import { CreateEmailVerification20260924230000 } from '../src/database/migrations/20260924230000-CreateEmailVerification.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { EmailCrypto } from '../src/modules/auth/email-crypto.js';
import { EmailRepository } from '../src/modules/auth/email.repository.js';

const env = loadEnv();
const database = `${env.TEST_DB_NAME}_codes_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = new DataSource({
  ...createDataSource({ ...env, DB_NAME: database }).options,
  migrations: [
    CreateAuthentication20260924221500,
    CreateEmailVerification20260924230000,
    CreateProfilePreferences20260926160000,
  ],
});
const crypto = new EmailCrypto('a'.repeat(64), 'b'.repeat(64));
const repository = new EmailRepository(source, crypto);
let userId: string;
const address = `codes-${randomBytes(5).toString('hex')}@example.com`;
const sent: Array<{ email: string; code: string; purpose: string }> = [];
const send = async (email: string, code: string, purpose: string) => {
  sent.push({ email, code, purpose });
};

beforeAll(async () => {
  await admin.initialize();
  await admin.query(`CREATE DATABASE \`${database}\``);
  await source.initialize();
  await source.runMigrations();
  userId = (
    await new AuthRepository(source).createLocal(
      address,
      Buffer.alloc(64),
      Buffer.alloc(32),
    )
  ).id;
});
afterAll(async () => {
  if (source.isInitialized) await source.destroy();
  if (admin.isInitialized) {
    await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await admin.destroy();
  }
});

describe('email codes with MySQL', () => {
  it('stores encrypted outbox, starts validity on delivery, and consumes once', async () => {
    expect(
      await repository.issue(userId, address, 'verify_email', '127.0.0.1'),
    ).toBe(true);
    const pending = await source.query(
      'SELECT expires_at FROM email_challenges WHERE user_id = ?',
      [userId],
    );
    expect(pending[0].expires_at).toBeNull();
    const outbox = await source.query('SELECT ciphertext FROM email_outbox');
    expect(JSON.stringify(outbox)).not.toContain(address);
    expect(await repository.deliverOne(send)).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.email).toBe(address);
    expect(
      (await source.query('SELECT ciphertext FROM email_outbox'))[0].ciphertext,
    ).toBeNull();
    await expect(
      repository.consume(
        userId,
        'verify_email',
        '000000' === sent[0]?.code ? '999999' : '000000',
      ),
    ).rejects.toMatchObject({ code: 'INVALID_CODE' });
    expect(
      (await source.query('SELECT attempts FROM email_challenges'))[0].attempts,
    ).toBe(1);
    await repository.consume(userId, 'verify_email', sent[0]!.code);
    expect(await new AuthRepository(source).isEmailVerified(userId)).toBe(true);
    await expect(
      repository.consume(userId, 'verify_email', sent[0]!.code),
    ).rejects.toMatchObject({ code: 'INVALID_CODE' });
  });

  it('persists resend interval and limit after another repository instance', async () => {
    const otherAddress = `absent-${randomBytes(5).toString('hex')}@example.com`;
    expect(
      await repository.issue(null, otherAddress, 'reset_password', '127.0.0.2'),
    ).toBe(false);
    await expect(
      new EmailRepository(source, crypto).issue(
        null,
        otherAddress,
        'reset_password',
        '127.0.0.2',
      ),
    ).rejects.toMatchObject({ status: 429 });
    await source.query(
      'UPDATE email_rate_limits SET last_issued_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 61 SECOND)',
    );
    await repository.issue(null, otherAddress, 'reset_password', '127.0.0.2');
    await source.query(
      'UPDATE email_rate_limits SET last_issued_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 61 SECOND)',
    );
    await repository.issue(null, otherAddress, 'reset_password', '127.0.0.2');
    await expect(
      repository.issue(null, otherAddress, 'reset_password', '127.0.0.2'),
    ).rejects.toMatchObject({ status: 429 });
  });

  it('retries delivery and discards revoked code without sending', async () => {
    await source.query(
      'UPDATE email_rate_limits SET last_issued_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 61 SECOND)',
    );
    await repository.issue(userId, address, 'reset_password', '127.0.0.3');
    let attempts = 0;
    await repository.deliverOne(async () => {
      attempts += 1;
      throw new Error('provider unavailable');
    });
    expect(attempts).toBe(1);
    await source.query(
      "UPDATE email_outbox SET available_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 SECOND) WHERE state = 'queued'",
    );
    await repository.deliverOne(send);
    expect(sent.at(-1)?.purpose).toBe('reset_password');
    await source.query(
      'UPDATE email_rate_limits SET last_issued_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 61 SECOND)',
    );
    await repository.issue(userId, address, 'reset_password', '127.0.0.3');
    await source.query(
      'UPDATE email_rate_limits SET last_issued_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 61 SECOND)',
    );
    await repository.issue(userId, address, 'reset_password', '127.0.0.3');
    const before = sent.length;
    await repository.deliverOne(send);
    expect(sent).toHaveLength(before);
  });

  it('reserves one delivery across workers and logs only safe event names', async () => {
    while (await repository.deliverOne(send)) {
      /* drain prior test deliveries */
    }
    const target = `worker-${randomBytes(5).toString('hex')}@example.com`;
    const user = await new AuthRepository(source).createLocal(
      target,
      Buffer.alloc(64),
      Buffer.alloc(32),
    );
    await repository.issue(user.id, target, 'reset_password', '127.0.0.4');
    const events: string[] = [];
    let deliveries = 0;
    const results = await Promise.all(
      [0, 1].map(() =>
        repository.deliverOne(
          async () => {
            deliveries += 1;
          },
          (event) => events.push(event),
        ),
      ),
    );
    expect(deliveries).toBe(1);
    expect(results.sort()).toEqual([false, true]);
    expect(events).toEqual(['email.sent']);
    expect(events.join('')).not.toContain(target);
  });

  it('discards failed delivery after five attempts and clears its encrypted payload', async () => {
    const target = `failed-${randomBytes(5).toString('hex')}@example.com`;
    const user = await new AuthRepository(source).createLocal(
      target,
      Buffer.alloc(64),
      Buffer.alloc(32),
    );
    await repository.issue(user.id, target, 'verify_email', '127.0.0.5');
    const events: string[] = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(
        await repository.deliverOne(
          async (recipient, code) => {
            throw new Error(`${recipient}: ${code}`);
          },
          (event) => events.push(event),
        ),
      ).toBe(true);
      await source.query(
        "UPDATE email_outbox SET available_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 SECOND) WHERE state = 'queued'",
      );
    }
    const rows = await source.query(
      'SELECT o.state, o.attempts, o.ciphertext FROM email_outbox o JOIN email_challenges c ON c.id = o.challenge_id WHERE c.user_id = ?',
      [user.id],
    );
    expect(rows[0].state).toBe('discarded');
    expect(rows[0].attempts).toBe(5);
    expect(rows[0].ciphertext).toBeNull();
    expect(events.every((event) => event === 'email.delivery_failed')).toBe(
      true,
    );
    expect(events.join('')).not.toContain(target);
  });
});
