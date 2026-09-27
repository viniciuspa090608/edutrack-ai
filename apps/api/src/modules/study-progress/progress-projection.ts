import { Temporal } from '@js-temporal/polyfill';
import { studyAchievementCatalog } from '@study-platform/contracts';
import type { AchievementCode } from '@study-platform/contracts';
export interface ProgressEvent {
  id: string;
  kind: string;
  occurred_at: Date;
  local_date: string;
}
const shift = (date: string, days: number) =>
  Temporal.PlainDate.from(date).add({ days }).toString();
export function projectProgress(events: ProgressEvent[], today: string) {
  const ordered = [...events].sort(
    (a, b) =>
      a.occurred_at.getTime() - b.occurred_at.getTime() ||
      a.id.localeCompare(b.id),
  );
  const days = new Set<string>(),
    spans = new Map<string, number>();
  let longestStreak = 0,
    tasks = 0,
    blocks = 0,
    reviews = 0,
    milestones = 0;
  const earned = new Map<AchievementCode, ProgressEvent>();
  let progress: Record<AchievementCode, number> = {
    FIRST_DAY: 0,
    THREE_DAY_STREAK: 0,
    SEVEN_DAY_STREAK: 0,
    TEN_TASKS: 0,
    FIVE_POMODORO_BLOCKS: 0,
    TWENTY_REVIEWS: 0,
    FIVE_SUBJECT_MILESTONES: 0,
  };
  for (const event of ordered) {
    if (!days.has(event.local_date)) {
      const left = spans.get(shift(event.local_date, -1)) ?? 0,
        right = spans.get(shift(event.local_date, 1)) ?? 0;
      const length = left + 1 + right;
      spans.set(event.local_date, length);
      spans.set(shift(event.local_date, -left), length);
      spans.set(shift(event.local_date, right), length);
      days.add(event.local_date);
      longestStreak = Math.max(longestStreak, length);
    }
    if (event.kind === 'TASK_COMPLETED') tasks++;
    if (event.kind === 'POMODORO_BLOCK_COMPLETED') blocks++;
    if (event.kind === 'FLASHCARD_REVIEWED') reviews++;
    if (
      event.kind === 'SUBJECT_PLAN_ITEM_COMPLETED' ||
      event.kind === 'ROADMAP_BLOCK_COMPLETED'
    )
      milestones++;
    progress = {
      FIRST_DAY: days.size,
      THREE_DAY_STREAK: longestStreak,
      SEVEN_DAY_STREAK: longestStreak,
      TEN_TASKS: tasks,
      FIVE_POMODORO_BLOCKS: blocks,
      TWENTY_REVIEWS: reviews,
      FIVE_SUBJECT_MILESTONES: milestones,
    };
    for (const item of studyAchievementCatalog)
      if (!earned.has(item.code) && progress[item.code] >= item.target)
        earned.set(item.code, event);
  }
  let anchor = days.has(today) ? today : shift(today, -1),
    currentStreak = 0;
  while (days.has(anchor)) {
    currentStreak++;
    anchor = shift(anchor, -1);
  }
  return {
    activeDays: days.size,
    currentStreak,
    longestStreak,
    progress,
    earned,
  };
}
