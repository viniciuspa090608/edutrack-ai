import '../../styles/achievement-colors.css';
import {
  Flag,
  Flame,
  Trophy,
  CheckCheck,
  Timer,
  Layers,
  Milestone,
} from 'lucide-react';
import type { AchievementCode } from '@study-platform/contracts';
export const achievementIcons = {
  FIRST_DAY: Flag,
  THREE_DAY_STREAK: Flame,
  SEVEN_DAY_STREAK: Trophy,
  TEN_TASKS: CheckCheck,
  FIVE_POMODORO_BLOCKS: Timer,
  TWENTY_REVIEWS: Layers,
  FIVE_SUBJECT_MILESTONES: Milestone,
} satisfies Record<AchievementCode, typeof Flag>;
