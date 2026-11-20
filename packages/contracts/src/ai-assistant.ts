import { z } from 'zod';
import { createCardSchema } from './flashcards.js';
import { createSubjectSchema } from './subjects.js';
import { createTaskSchema } from './tasks.js';

export const assistantPageSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z
      .object({ at: z.iso.datetime(), id: z.uuid() })
      .strict()
      .optional(),
  })
  .strict();

export const assistantSendSchema = z
  .object({
    conversationId: z.uuid().optional(),
    messageId: z.uuid(),
    attemptId: z.uuid(),
    text: z.string().trim().min(1).max(8000),
  })
  .strict();

export const assistantConfirmSchema = z
  .object({
    previewId: z.uuid(),
    idempotencyKey: z.uuid(),
  })
  .strict();

export const assistantActionSchema = z.discriminatedUnion('kind', [
  z
    .object({ kind: z.literal('subject'), subject: createSubjectSchema })
    .strict(),
  z.object({ kind: z.literal('task'), task: createTaskSchema }).strict(),
  z
    .object({
      kind: z.literal('flashcards'),
      deckId: z.uuid(),
      cards: z.array(createCardSchema).min(1).max(20),
    })
    .strict(),
]);

export type AssistantAction = z.infer<typeof assistantActionSchema>;

export const assistantAvailabilitySchema = z.object({
  enabled: z.boolean(),
  messageLimit: z.number().int().positive(),
});
const cursorSchema = z
  .object({ at: z.iso.datetime(), id: z.uuid() })
  .nullable();
export const assistantConversationsSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      title: z.string(),
      createdAt: z.iso.datetime(),
      updatedAt: z.iso.datetime(),
    }),
  ),
  cursor: cursorSchema,
});
export const assistantMessagesSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      role: z.enum(['user', 'assistant']),
      text: z.string(),
      createdAt: z.iso.datetime(),
      retryable: z.boolean(),
      preview: z
        .object({
          id: z.uuid(),
          key: z.uuid(),
          destination: z.string(),
          action: assistantActionSchema,
          confirmed: z.boolean(),
        })
        .nullable(),
    }),
  ),
  cursor: cursorSchema,
});
export type AssistantConversations = z.infer<
  typeof assistantConversationsSchema
>;
export type AssistantMessages = z.infer<typeof assistantMessagesSchema>;
