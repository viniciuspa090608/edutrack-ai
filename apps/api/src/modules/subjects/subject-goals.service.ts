import { Temporal } from '@js-temporal/polyfill';
import {
  subjectGoalInputSchema,
  subjectInsightsSchema,
  type GoalIndicator,
} from '@study-platform/contracts';
import type { DataSource } from 'typeorm';
import { HttpError } from '../../shared/http-error.js';
import type { PreferencesService } from '../preferences/preferences.service.js';
import type { SubjectsService } from './subjects.service.js';
import { SubjectGoalsRepository } from './subject-goals.repository.js';
import { subjectTaskEvidence } from '../tasks/subject-evidence.js';
import { subjectStudyEvidence } from '../pomodoro/subject-evidence.js';
import { subjectReviewEvidence } from '../flashcards/subject-evidence.js';
import { calculateSubjectInsights, goalWindow } from './subject-insights.js';
import { localDate } from '../analytics/calendar.js';

export class SubjectGoalsService {
  private readonly repository: SubjectGoalsRepository;
  constructor(
    private readonly source: DataSource,
    private readonly subjects: Pick<SubjectsService, 'requireOwned'>,
    private readonly prefs: Pick<PreferencesService, 'read'>,
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.repository = new SubjectGoalsRepository(source);
  }
  async read(userId: string, subjectId: string) {
    await this.subjects.requireOwned(userId, subjectId);
    const [goal, preferences] = await Promise.all([
      this.repository.read(userId, subjectId),
      this.prefs.read(userId),
    ]);
    const now = this.clock();
    const window = goalWindow(goal, now);
    const today = localDate(now, goal?.timeZone ?? 'America/Sao_Paulo');
    const availableIndicators: GoalIndicator[] = [];
    if (preferences.tasks) availableIndicators.push('tasks');
    if (preferences.pomodoro) availableIndicators.push('studyHours');
    if (preferences.flashcards) availableIndicators.push('reviewAccuracy');
    const [tasks, study, reviews] = await Promise.all([
      preferences.tasks
        ? subjectTaskEvidence(
            this.source,
            userId,
            subjectId,
            window.recentStart,
            now,
            today.toString(),
            today.add({ days: 7 }).toString(),
          )
        : null,
      preferences.pomodoro
        ? subjectStudyEvidence(
            this.source,
            userId,
            subjectId,
            window.start,
            window.recentStart,
            now,
          )
        : null,
      preferences.flashcards
        ? subjectReviewEvidence(
            this.source,
            userId,
            subjectId,
            window.start,
            window.trendStart,
            window.previousStart,
            now,
          )
        : null,
    ]);
    return subjectInsightsSchema.parse(
      calculateSubjectInsights(
        goal,
        availableIndicators,
        { tasks, study, reviews },
        now,
        subjectId,
      ),
    );
  }
  async save(userId: string, subjectId: string, input: unknown) {
    await this.subjects.requireOwned(userId, subjectId);
    const parsed = subjectGoalInputSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(
        400,
        'INVALID_INPUT',
        'Revise indicador, valor, prazo e fuso da meta.',
      );
    const data = parsed.data;
    const now = this.clock();
    if (
      Temporal.PlainDate.compare(
        Temporal.PlainDate.from(data.dueDate),
        localDate(now, data.timeZone),
      ) < 0
    )
      throw new HttpError(
        400,
        'INVALID_INPUT',
        'Escolha um prazo a partir de hoje.',
      );
    const preferences = await this.prefs.read(userId);
    const enabled =
      data.indicator === 'tasks'
        ? preferences.tasks
        : data.indicator === 'studyHours'
          ? preferences.pomodoro
          : preferences.flashcards;
    if (!enabled)
      throw new HttpError(
        403,
        'MODULE_DISABLED',
        'Ative o módulo deste indicador ou escolha outro.',
      );
    await this.repository.save(userId, subjectId, data, now);
    return this.read(userId, subjectId);
  }
}
