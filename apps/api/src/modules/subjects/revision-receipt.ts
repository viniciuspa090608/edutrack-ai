import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { HttpError } from '../../shared/http-error.js';
const claimsSchema = z
  .object({
    v: z.literal(1),
    userId: z.uuid(),
    subjectId: z.uuid(),
    roadmapId: z.uuid(),
    baseRevision: z.number().int().positive(),
    origin: z.enum(['ia', 'restauracao']),
    sourceRevision: z.number().int().positive().nullable(),
    preservedCount: z.number().int().min(0).max(400),
    prefixHash: z.string().regex(/^[a-f0-9]{64}$/),
    suffixIds: z.array(z.uuid()).max(400),
    idempotencyKey: z.uuid(),
    expiresAt: z.number().int().positive(),
  })
  .strict();
type Claims = z.infer<typeof claimsSchema>;
export class RevisionReceipt {
  private readonly key: Buffer;
  constructor(
    key: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.key = createHmac('sha256', Buffer.from(key, 'hex'))
      .update('edutrack:roadmap-revision:v1')
      .digest();
  }
  private sign(payload: string) {
    return createHmac('sha256', this.key).update(payload).digest();
  }
  issue(input: Omit<Claims, 'v' | 'expiresAt' | 'idempotencyKey'>) {
    const claims = claimsSchema.parse({
      ...input,
      v: 1,
      idempotencyKey: randomUUID(),
      expiresAt: this.now().getTime() + 1800000,
    });
    const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
    return {
      receipt: `${payload}.${this.sign(payload).toString('base64url')}`,
      idempotencyKey: claims.idempotencyKey,
      expiresAt: new Date(claims.expiresAt).toISOString(),
    };
  }
  verify(
    receipt: string,
    userId: string,
    subjectId: string,
    roadmapId: string,
  ) {
    const invalid = () =>
      new HttpError(
        400,
        'INVALID_RECEIPT',
        'A prévia não é válida. Prepare uma nova prévia.',
      );
    const [payload, signature, extra] = receipt.split('.');
    if (!payload || !signature || extra !== undefined || receipt.length > 24576)
      throw invalid();
    const expected = this.sign(payload),
      actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw invalid();
    let value: unknown;
    try {
      value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch {
      throw invalid();
    }
    const parsed = claimsSchema.safeParse(value);
    if (
      !parsed.success ||
      parsed.data.userId !== userId ||
      parsed.data.subjectId !== subjectId ||
      parsed.data.roadmapId !== roadmapId
    )
      throw invalid();
    if (parsed.data.expiresAt <= this.now().getTime())
      throw new HttpError(
        400,
        'RECEIPT_EXPIRED',
        'A prévia expirou. Prepare uma nova prévia.',
      );
    return parsed.data;
  }
}
