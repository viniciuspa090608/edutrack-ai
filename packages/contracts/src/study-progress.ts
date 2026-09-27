import { z } from 'zod';
export const studyTimeZoneSchema = z
  .string()
  .min(1)
  .max(100)
  .refine((value) => {
    if (/^[+-]/.test(value)) return false;
    try {
      new Intl.DateTimeFormat('en', { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, 'Informe um fuso IANA válido.');
export const studyTimeZoneUpdateSchema = z
  .object({ timeZone: studyTimeZoneSchema })
  .strict();
export const studyTimeZoneSettingsSchema = z
  .object({
    timeZone: studyTimeZoneSchema,
    trackingStartedAt: z.iso.datetime(),
  })
  .strict();
export const achievementCodeSchema = z.enum([
  'FIRST_DAY',
  'THREE_DAY_STREAK',
  'SEVEN_DAY_STREAK',
  'TEN_TASKS',
  'FIVE_POMODORO_BLOCKS',
  'TWENTY_REVIEWS',
  'FIVE_SUBJECT_MILESTONES',
]);
export const studyAchievementCatalog = [
  {
    code: 'FIRST_DAY',
    name: 'Primeiro dia',
    criterion: 'Alcançar 1 dia ativo.',
    target: 1,
  },
  {
    code: 'THREE_DAY_STREAK',
    name: 'Três dias seguidos',
    criterion: 'Estudar em 3 datas consecutivas.',
    target: 3,
  },
  {
    code: 'SEVEN_DAY_STREAK',
    name: 'Sete dias seguidos',
    criterion: 'Estudar em 7 datas consecutivas.',
    target: 7,
  },
  {
    code: 'TEN_TASKS',
    name: 'Tarefas em dia',
    criterion: 'Concluir tarefas em 10 transições confirmadas.',
    target: 10,
  },
  {
    code: 'FIVE_POMODORO_BLOCKS',
    name: 'Foco consistente',
    criterion: 'Completar 5 blocos Pomodoro de 25 minutos.',
    target: 5,
  },
  {
    code: 'TWENTY_REVIEWS',
    name: 'Revisão constante',
    criterion: 'Registrar 20 avaliações de flashcards.',
    target: 20,
  },
  {
    code: 'FIVE_SUBJECT_MILESTONES',
    name: 'Plano em andamento',
    criterion: 'Concluir 5 itens manuais ou blocos de roadmap, somados.',
    target: 5,
  },
] as const;
export const studyProgressSchema = studyTimeZoneSettingsSchema
  .extend({
    today: z.iso.date(),
    currentStreak: z.number().int().nonnegative(),
    longestStreak: z.number().int().nonnegative(),
    activeDays: z.number().int().nonnegative(),
    achievements: z
      .array(
        z
          .object({
            code: achievementCodeSchema,
            name: z.string(),
            criterion: z.string(),
            target: z.number().int().positive(),
            progress: z.number().int().nonnegative(),
            earnedAt: z.iso.datetime().nullable(),
          })
          .strict(),
      )
      .length(7),
  })
  .strict();
export type AchievementCode = z.infer<typeof achievementCodeSchema>;
export type StudyProgress = z.infer<typeof studyProgressSchema>;
export type StudyTimeZoneSettings = z.infer<typeof studyTimeZoneSettingsSchema>;
