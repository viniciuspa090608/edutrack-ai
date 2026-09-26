import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { HttpError } from '../../shared/http-error.js';
const payloadSchema = z
  .object({
    v: z.literal(1),
    userId: z.uuid(),
    subjectId: z.uuid(),
    generationId: z.uuid(),
    expiresAt: z.number().int().positive(),
  })
  .strict();
export class RoadmapReceipt {
  constructor(
    private readonly key: string | undefined,
    private readonly now: () => Date = () => new Date(),
  ) {}
  private signature(payload: string) {
    if (!this.key)
      throw new HttpError(
        503,
        'AI_UNAVAILABLE',
        'A geração por IA está indisponível.',
      );
    return createHmac('sha256', Buffer.from(this.key, 'hex'))
      .update(payload)
      .digest();
  }
  issue(userId: string, subjectId: string) {
    const expiresAt = this.now().getTime() + 30 * 60 * 1000;
    const payload = Buffer.from(
      JSON.stringify({
        v: 1,
        userId,
        subjectId,
        generationId: randomUUID(),
        expiresAt,
      }),
    ).toString('base64url');
    return {
      receipt: `${payload}.${this.signature(payload).toString('base64url')}`,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }
  verify(receipt: string, userId: string, subjectId: string) {
    const invalid = () =>
      new HttpError(
        400,
        'INVALID_RECEIPT',
        'A prévia não é válida. Gere novamente.',
      );
    const [payload, encoded, extra] = receipt.split('.');
    if (!payload || !encoded || extra !== undefined || receipt.length > 2048)
      throw invalid();
    const actual = Buffer.from(encoded, 'base64url'),
      expected = this.signature(payload);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw invalid();
    let decoded: unknown;
    try {
      decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch {
      throw invalid();
    }
    const result = payloadSchema.safeParse(decoded);
    if (
      !result.success ||
      result.data.userId !== userId ||
      result.data.subjectId !== subjectId
    )
      throw invalid();
    if (result.data.expiresAt <= this.now().getTime())
      throw new HttpError(
        400,
        'RECEIPT_EXPIRED',
        'A prévia expirou. Gere novamente.',
      );
    return result.data.generationId;
  }
}
