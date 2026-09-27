import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { HttpError } from '../../shared/http-error.js';
const payloadSchema = z
  .object({
    kind: z.literal('flashcards-v1'),
    userId: z.uuid(),
    deckId: z.uuid(),
    generationId: z.uuid(),
    expiresAt: z.number().int().positive(),
    cardIds: z.array(z.uuid()).min(1).max(20),
  })
  .strict();
export class FlashcardReceipt {
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
  issue(userId: string, deckId: string, cardIds: string[]) {
    const generationId = randomUUID(),
      expiresAt = this.now().getTime() + 30 * 60 * 1000;
    const payload = Buffer.from(
      JSON.stringify({
        kind: 'flashcards-v1',
        userId,
        deckId,
        generationId,
        expiresAt,
        cardIds,
      }),
    ).toString('base64url');
    return {
      generationId,
      expiresAt: new Date(expiresAt).toISOString(),
      receipt: `${payload}.${this.signature(payload).toString('base64url')}`,
    };
  }
  verify(receipt: string, userId: string, deckId: string) {
    const invalid = () =>
      new HttpError(
        400,
        'INVALID_RECEIPT',
        'A prévia não é válida. Gere novamente.',
      );
    const [payload, signature, extra] = receipt.split('.');
    if (!payload || !signature || extra !== undefined || receipt.length > 4096)
      throw invalid();
    const actual = Buffer.from(signature, 'base64url'),
      expected = this.signature(payload);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw invalid();
    let value: unknown;
    try {
      value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch {
      throw invalid();
    }
    const parsed = payloadSchema.safeParse(value);
    if (
      !parsed.success ||
      parsed.data.userId !== userId ||
      parsed.data.deckId !== deckId
    )
      throw invalid();
    // Expiration is checked inside the card transaction, after looking for an existing confirmation.
    return parsed.data;
  }
}
