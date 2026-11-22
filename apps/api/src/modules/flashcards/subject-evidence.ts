import type { DataSource } from 'typeorm';

/** GOOD/EASY are self-reported successful recalls, not academic grades. */
export async function subjectReviewEvidence(
  source: DataSource,
  userId: string,
  subjectId: string,
  start: Date,
  recentStart: Date,
  previousStart: Date,
  now: Date,
) {
  const [row] = await source.query<
    Array<{
      total: string;
      good: string;
      recentTotal: string;
      recentGood: string;
      previousTotal: string;
      previousGood: string;
    }>
  >(
    `SELECT COALESCE(SUM(e.reviewed_at>=?),0) AS total,
    COALESCE(SUM(e.reviewed_at>=? AND e.rating IN ('GOOD','EASY')),0) AS good,
    COALESCE(SUM(e.reviewed_at>=?),0) AS recentTotal,
    COALESCE(SUM(e.reviewed_at>=? AND e.rating IN ('GOOD','EASY')),0) AS recentGood,
    COALESCE(SUM(e.reviewed_at>=? AND e.reviewed_at<?),0) AS previousTotal,
    COALESCE(SUM(e.reviewed_at>=? AND e.reviewed_at<? AND e.rating IN ('GOOD','EASY')),0) AS previousGood
    FROM flashcard_review_events e JOIN flashcards c ON c.id=e.card_id
    JOIN flashcard_decks d ON d.id=c.deck_id
    WHERE e.user_id=? AND d.user_id=? AND d.subject_id=? AND e.reviewed_at>=? AND e.reviewed_at<=?`,
    [
      start,
      start,
      recentStart,
      recentStart,
      previousStart,
      recentStart,
      previousStart,
      recentStart,
      userId,
      userId,
      subjectId,
      new Date(Math.min(start.getTime(), previousStart.getTime())),
      now,
    ],
  );
  return {
    total: Number(row!.total),
    good: Number(row!.good),
    recentTotal: Number(row!.recentTotal),
    recentGood: Number(row!.recentGood),
    previousTotal: Number(row!.previousTotal),
    previousGood: Number(row!.previousGood),
  };
}
