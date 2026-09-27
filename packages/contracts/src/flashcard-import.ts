import { z } from 'zod';
export const importMaxBytes = 2_097_152;
export const importMaxRecords = 1000;
export const importMaxColumns = 100;
export const importFormatSchema = z.enum(['csv', 'tsv']);
export const importUploadSchema = z
  .object({ format: importFormatSchema })
  .strict();
export const importMappingSchema = z
  .object({
    frontColumn: z
      .number()
      .int()
      .min(0)
      .max(importMaxColumns - 1),
    backColumn: z
      .number()
      .int()
      .min(0)
      .max(importMaxColumns - 1),
  })
  .strict()
  .refine(
    (value) => value.frontColumn !== value.backColumn,
    'Selecione duas colunas distintas.',
  );
export function mappingForColumns(columnCount: number) {
  return importMappingSchema.refine(
    (value) =>
      value.frontColumn < columnCount && value.backColumn < columnCount,
    'Coluna fora do cabeçalho.',
  );
}
export const importConfirmSchema = z
  .object({ confirm: z.literal(true) })
  .strict();
const count = z.number().int().min(0).max(importMaxRecords);
export const importCountsSchema = z
  .object({ records: count, imported: count, ignored: count, rejected: count })
  .strict()
  .refine(
    (value) =>
      value.records === value.imported + value.ignored + value.rejected,
    'Contagens inconsistentes.',
  );
export const importErrorSchema = z
  .object({
    line: z.number().int().positive(),
    reason: z.string().min(1).max(200),
  })
  .strict();
export const importSampleSchema = z
  .object({
    line: z.number().int().positive(),
    front: z.string().max(importMaxBytes),
    back: z.string().max(importMaxBytes),
    status: z.enum(['imported', 'ignored', 'rejected']),
    reason: z.string().max(200).optional(),
  })
  .strict();
export const importPreviewSchema = z
  .object({
    mapping: importMappingSchema,
    counts: importCountsSchema,
    sample: z.array(importSampleSchema).max(20),
    errors: z.array(importErrorSchema).max(importMaxRecords),
  })
  .strict()
  .refine(
    (value) => value.errors.length === value.counts.rejected,
    'Rejeições inconsistentes.',
  );
export const importResultSchema = z
  .object({
    counts: importCountsSchema,
    errors: z.array(importErrorSchema).max(importMaxRecords),
  })
  .strict()
  .refine(
    (value) => value.errors.length === value.counts.rejected,
    'Rejeições inconsistentes.',
  );
const attemptFields = {
  id: z.uuid(),
  deckId: z.uuid(),
  expiresAt: z.iso.datetime(),
};
const activeFields = {
  ...attemptFields,
  format: importFormatSchema,
  columns: z.array(z.string()).min(2).max(importMaxColumns),
  records: count,
};
export const importAttemptSchema = z.discriminatedUnion('state', [
  z.object({ ...activeFields, state: z.literal('uploaded') }).strict(),
  z
    .object({
      ...activeFields,
      state: z.literal('preview'),
      preview: importPreviewSchema,
    })
    .strict(),
  z
    .object({
      ...attemptFields,
      state: z.literal('completed'),
      result: importResultSchema,
    })
    .strict(),
]);
export type ImportFormat = z.infer<typeof importFormatSchema>;
export type ImportMapping = z.infer<typeof importMappingSchema>;
export type ImportPreview = z.infer<typeof importPreviewSchema>;
export type ImportResult = z.infer<typeof importResultSchema>;
export type ImportAttempt = z.infer<typeof importAttemptSchema>;
