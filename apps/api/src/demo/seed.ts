import { createHash } from 'node:crypto';
import { Temporal } from '@js-temporal/polyfill';
import type { DataSource, EntityManager } from 'typeorm';
import type { ReviewRating } from '@study-platform/contracts';
import { hashPassword } from '../modules/auth/password.js';
import { publishActivity } from '../modules/analytics/activity-publisher.js';
import type { ActivityKind } from '../modules/analytics/activity-publisher.js';
import {
  initialPolicyState,
  sm2InspiredV1,
} from '../modules/flashcards/review-policy.js';
import { requireEmptyDemo } from './database.js';

export const demoPassword = 'DemoEduTrack2026!';
export const demoProfiles = ['ativo', 'intermediario', 'iniciante'] as const;
const zone = 'America/Sao_Paulo';

export function demoDate(input?: string): string {
  if (input !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(input))
    throw new Error('Data-base inválida: use AAAA-MM-DD.');
  try {
    const date = input
      ? Temporal.PlainDate.from(input, { overflow: 'reject' })
      : Temporal.Now.plainDateISO(zone);
    if (date.year < 2000 || date.year > 2099) throw new Error();
    return date.toString();
  } catch {
    throw new Error('Data-base inválida: use uma data real entre 2000 e 2099.');
  }
}

export function demoId(key: string): string {
  const hex = createHash('sha256').update(`edutrack-demo:${key}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

type Activity = {
  user: string;
  kind: ActivityKind;
  type: string;
  id: string;
  transition: string;
  at: Date;
};

export async function seedDemo(
  source: DataSource,
  date: string,
): Promise<void> {
  const base = Temporal.PlainDate.from(demoDate(date));
  const at = (offset: number, hour = 10) =>
    new Date(
      base.add({ days: offset }).toZonedDateTime({
        timeZone: zone,
        plainTime: `${String(hour).padStart(2, '0')}:00`,
      }).epochMilliseconds,
    );
  const day = (offset: number) => base.add({ days: offset }).toString();
  await source.transaction(async (manager) => {
    await requireEmptyDemo(manager);
    const events: Activity[] = [];
    const event = (
      user: string,
      kind: ActivityKind,
      type: string,
      id: string,
      offset: number,
      transition = '1',
    ) => events.push({ user, kind, type, id, transition, at: at(offset) });
    await manager.query('DELETE FROM study_analytics_coverage');
    for (const metric of [
      'activeMs',
      'pomodoroSessions',
      'tasks',
      'reviews',
      'planItems',
      'roadmapBlocks',
    ])
      await insert(manager, 'study_analytics_coverage', {
        metric,
        started_at: at(-70),
      });
    for (const [profileIndex, profile] of demoProfiles.entries()) {
      const id = (key: string) => demoId(`${profile}:${key}`);
      const user = id('user');
      const created = at(-65);
      await insert(manager, 'users', {
        id: user,
        email: `${profile}@demo.edutrack.test`,
        display_name:
          profile === 'ativo'
            ? 'Ana · perfil ativo'
            : profile === 'intermediario'
              ? 'Bruno · perfil intermediário'
              : 'Clara · primeiros passos',
        email_verified_at: created,
        created_at: created,
        updated_at: created,
      });
      const password = await hashPassword(demoPassword);
      await insert(manager, 'password_credentials', {
        user_id: user,
        password_hash: password.hash,
        salt: password.salt,
        hash_version: 1,
        updated_at: created,
      });
      await insert(manager, 'user_preferences', {
        user_id: user,
        tasks_enabled: true,
        subjects_enabled: true,
        flashcards_enabled: true,
        ai_enabled: true,
      });
      // The user-insert trigger creates tracking and its first timezone row.
      await manager.query(
        'UPDATE study_progress_tracking SET study_timezone=?,tracking_started_at_utc=? WHERE user_id=?',
        [zone, created, user],
      );
      await manager.query(
        'UPDATE study_timezone_history SET timezone_id=?,effective_at_utc=? WHERE user_id=?',
        [zone, created, user],
      );
      const subjectNames = ['TypeScript', 'Banco de dados', 'Matemática'];
      const subjects = 3 - profileIndex;
      for (let index = 0; index < subjects; index++) {
        const subject = id(`subject:${index}`);
        await insert(manager, 'study_subjects', {
          id: subject,
          user_id: user,
          name: subjectNames[index],
          current_level: profileIndex === 2 ? 'BEGINNER' : 'INTERMEDIATE',
          objective: `Consolidar fundamentos de ${subjectNames[index]} e aplicar em projetos.`,
          due_date: day(30 + index * 7),
          weekly_hours: 4,
          created_at: created,
          updated_at: created,
        });
        if (profileIndex === 2) continue;
        await insert(manager, 'subject_known_topics', {
          id: id(`known:${index}`),
          subject_id: subject,
          name: 'Conceitos introdutórios',
          position: 0,
        });
        for (let item = 0; item < 3; item++) {
          const plan = id(`plan:${index}:${item}`);
          const completed = item === 0;
          await insert(manager, 'subject_plan_items', {
            id: plan,
            subject_id: subject,
            title: [
              'Revisar fundamentos',
              'Resolver exercícios',
              'Construir projeto',
            ][item],
            status: completed
              ? 'COMPLETED'
              : item === 1
                ? 'IN_PROGRESS'
                : 'PENDING',
            position: item,
            created_at: created,
            updated_at: completed ? at(-20 + index) : created,
          });
          if (completed)
            event(
              user,
              'SUBJECT_PLAN_ITEM_COMPLETED',
              'plan-item',
              plan,
              -20 + index,
            );
        }
        const roadmap = id(`roadmap:${index}`);
        const content = {
          title: `Trilha de ${subjectNames[index]}`,
          description:
            'Fundamentos e prática, preparada localmente para demonstração.',
          blocks: [] as Array<{
            title: string;
            description: string;
            steps: Array<{
              id: string;
              title: string;
              description: string;
              completed: boolean;
            }>;
          }>,
        };
        await insert(manager, 'subject_roadmaps', {
          id: roadmap,
          subject_id: subject,
          title: content.title,
          description: content.description,
          revision: 2,
          created_at: created,
          updated_at: at(-5),
        });
        for (let blockIndex = 0; blockIndex < 2; blockIndex++) {
          const block = id(`block:${index}:${blockIndex}`);
          const blockContent = {
            title: blockIndex === 0 ? 'Fundamentos' : 'Aplicação',
            description: 'Aprender com exemplos e exercícios.',
            steps: [] as Array<{
              id: string;
              title: string;
              description: string;
              completed: boolean;
            }>,
          };
          await insert(manager, 'subject_roadmap_blocks', {
            id: block,
            roadmap_id: roadmap,
            title: blockContent.title,
            description: blockContent.description,
            position: blockIndex,
          });
          for (let stepIndex = 0; stepIndex < 2; stepIndex++) {
            const completed =
              blockIndex === 0 ||
              (profileIndex === 0 && index === 0) ||
              stepIndex === 0;
            const step = {
              id: id(`step:${index}:${blockIndex}:${stepIndex}`),
              title:
                stepIndex === 0 ? 'Estudar exemplos' : 'Praticar e revisar',
              description: 'Registrar aprendizados e resolver uma atividade.',
              completed,
            };
            await insert(manager, 'subject_roadmap_steps', {
              ...step,
              block_id: block,
              position: stepIndex,
            });
            blockContent.steps.push(step);
          }
          content.blocks.push(blockContent);
          if (blockContent.steps.every((step) => step.completed))
            event(
              user,
              'ROADMAP_BLOCK_COMPLETED',
              'roadmap-block',
              createHash('sha256')
                .update(
                  `${roadmap}:${blockContent.steps.map((step) => step.id).join(',')}`,
                )
                .digest('hex'),
              -12 + index + blockIndex,
            );
        }
        const first = {
          ...content,
          blocks: content.blocks.map((block) => ({
            ...block,
            steps: block.steps.map((step) => ({ ...step, completed: false })),
          })),
        };
        for (const revision of [1, 2])
          await insert(manager, 'subject_roadmap_revisions', {
            roadmap_id: roadmap,
            revision,
            origin: 'manual',
            source_revision: null,
            content: JSON.stringify(revision === 1 ? first : content),
            action_id: revision === 2 ? id(`roadmap-action:${index}`) : null,
            created_at: revision === 1 ? created : at(-5),
          });
      }
      const taskCount = profileIndex === 0 ? 18 : profileIndex === 1 ? 6 : 1;
      for (let index = 0; index < taskCount; index++) {
        const task = id(`task:${index}`);
        const completed =
          profileIndex === 0 ? index < 12 : profileIndex === 1 && index < 2;
        const offset = index < 6 ? -58 + index * 7 : -12 + index;
        await insert(manager, 'study_tasks', {
          id: task,
          user_id: user,
          subject_id: id(`subject:${index % subjects}`),
          title: `${completed ? 'Revisar' : 'Praticar'} ${subjectNames[index % subjects]} · atividade ${index + 1}`,
          description:
            'Estudar o material, resolver exercícios e registrar dúvidas.',
          priority: ['HIGH', 'MEDIUM', 'LOW'][index % 3],
          due_date: day(
            completed
              ? offset
              : index === taskCount - 1 && profileIndex !== 2
                ? -2
                : 3 + index,
          ),
          status: completed
            ? 'COMPLETED'
            : index % 2 === 0 && profileIndex !== 2
              ? 'IN_PROGRESS'
              : 'PENDING',
          created_at: created,
          updated_at: completed ? at(offset) : at(-1),
        });
        if (profileIndex !== 2)
          for (let sub = 0; sub < 3; sub++)
            await insert(manager, 'task_subtasks', {
              id: id(`subtask:${index}:${sub}`),
              task_id: task,
              title: [
                'Ler material',
                'Resolver exercícios',
                'Revisar anotações',
              ][sub],
              is_completed: completed || sub === 0,
              position: sub,
              created_at: created,
              updated_at: completed ? at(offset) : at(-1),
            });
        if (completed) event(user, 'TASK_COMPLETED', 'task', task, offset);
      }
      if (profileIndex === 2) continue;
      const routine = id('routine');
      await insert(manager, 'study_routines', {
        id: routine,
        user_id: user,
        name: 'Plano semanal de estudos',
        time_zone: zone,
        created_at: created,
        updated_at: created,
      });
      for (const weekday of [1, 3, 5])
        await insert(manager, 'study_routine_slots', {
          id: id(`slot:${weekday}`),
          routine_id: routine,
          weekday,
          start_time: '09:00',
          end_time: '11:00',
        });
      const offsets =
        profileIndex === 0
          ? [-59, -45, -32, -21, -15, -9, -7, -6, -5, -4, -3, -2, -1]
          : [-30, -16, -6];
      for (const [index, offset] of offsets.entries()) {
        const session = id(`pomodoro:${index}`);
        const canceled = index === 0;
        const start = at(offset, 9);
        const end = new Date(start.getTime() + (canceled ? 600000 : 1500000));
        await insert(manager, 'pomodoro_sessions', {
          id: session,
          user_id: user,
          task_id: id(`task:${index % taskCount}`),
          subject_id: id(`subject:${index % subjects}`),
          state: canceled ? 'CANCELED' : 'COMPLETED',
          active_ms: end.getTime() - start.getTime(),
          completed_blocks: canceled ? 0 : 1,
          running_since: null,
          started_at: start,
          ended_at: end,
          version: 1,
        });
        await insert(manager, 'pomodoro_active_intervals', {
          id: id(`interval:${index}`),
          user_id: user,
          session_id: session,
          started_at: start,
          ended_at: end,
          source_version: 1,
        });
        if (!canceled) {
          events.push({
            user,
            kind: 'POMODORO_BLOCK_COMPLETED',
            type: 'pomodoro-block',
            id: session,
            transition: '1',
            at: end,
          });
          events.push({
            user,
            kind: 'POMODORO_SESSION_COMPLETED',
            type: 'pomodoro',
            id: session,
            transition: 'terminal',
            at: end,
          });
        }
      }
      const decks = profileIndex === 0 ? 2 : 1;
      for (let deckIndex = 0; deckIndex < decks; deckIndex++) {
        const deck = id(`deck:${deckIndex}`);
        await insert(manager, 'flashcard_decks', {
          id: deck,
          user_id: user,
          subject_id: id(`subject:${deckIndex}`),
          name: `Revisão de ${subjectNames[deckIndex]}`,
          description: 'Perguntas curtas para praticar lembrança ativa.',
          created_at: created,
          updated_at: created,
        });
        for (let cardIndex = 0; cardIndex < 8; cardIndex++) {
          const card = id(`card:${deckIndex}:${cardIndex}`);
          await insert(manager, 'flashcards', {
            id: card,
            deck_id: deck,
            front: [
              'O que é um tipo no TypeScript?',
              'Para que serve uma chave estrangeira?',
              'Como reduzir problemas em partes menores?',
              'O que diferencia interface e implementação?',
            ][cardIndex % 4],
            back: [
              'Um contrato que descreve valores e operações válidas.',
              'Preservar a integridade entre registros relacionados.',
              'Dividir em etapas pequenas, verificar cada uma e integrar.',
              'A interface define o contrato; a implementação executa o comportamento.',
            ][cardIndex % 4],
            created_at: created,
            updated_at: created,
          });
          let state = initialPolicyState();
          let due = at(-60);
          let revision = 1;
          const reviews =
            cardIndex < 6 ? (profileIndex === 0 ? [-50, -35, -10] : [-25]) : [];
          for (const [reviewIndex, offset] of reviews.entries()) {
            const rating: ReviewRating =
              cardIndex % 4 === 0
                ? 'AGAIN'
                : cardIndex % 4 === 1
                  ? 'HARD'
                  : cardIndex % 4 === 2
                    ? 'GOOD'
                    : 'EASY';
            const reviewed = at(offset);
            const next = sm2InspiredV1.next(state, rating, reviewed);
            const reviewId = id(
              `review:${deckIndex}:${cardIndex}:${reviewIndex}`,
            );
            await insert(manager, 'flashcard_review_events', {
              id: reviewId,
              card_id: card,
              user_id: user,
              rating,
              reviewed_at: reviewed,
              interval_seconds: next.intervalSeconds,
              due_at: next.dueAt,
              policy_id: sm2InspiredV1.id,
              policy_version: 1,
              content_generation: 1,
              idempotency_key: reviewId,
              previous_state: JSON.stringify(state),
              new_state: JSON.stringify(next.state),
            });
            event(
              user,
              'FLASHCARD_REVIEWED',
              'flashcard',
              card,
              offset,
              reviewId,
            );
            state = next.state;
            due = next.dueAt;
            revision++;
          }
          await insert(manager, 'flashcard_review_states', {
            card_id: card,
            due_at: due,
            revision,
            content_generation: 1,
            policy_id: sm2InspiredV1.id,
            policy_version: 1,
            policy_state: JSON.stringify(state),
            created_at: created,
            updated_at: reviews.length
              ? at(reviews[reviews.length - 1]!)
              : created,
          });
        }
        if (profileIndex === 0)
          await insert(manager, 'flashcard_import_attempts', {
            id: id(`import:${deckIndex}`),
            user_id: user,
            deck_id: deck,
            format: 'csv',
            state: 'completed',
            file_bytes: null,
            preview: null,
            result: JSON.stringify({
              counts: { records: 8, imported: 8, ignored: 0, rejected: 0 },
              errors: [],
            }),
            expires_at: at(1),
            created_at: created,
          });
      }
    }
    events.sort(
      (a, b) => a.at.getTime() - b.at.getTime() || a.id.localeCompare(b.id),
    );
    for (const event of events)
      await publishActivity(
        manager,
        event.user,
        event.kind,
        event.type,
        event.id,
        ['task', 'plan-item', 'roadmap-block'].includes(event.type)
          ? undefined
          : event.transition,
        event.at,
      );
  });
}

async function insert(
  manager: EntityManager,
  table: string,
  values: Record<string, unknown>,
): Promise<void> {
  const keys = Object.keys(values);
  await manager.query(
    `INSERT INTO \`${table}\` (${keys.map((key) => `\`${key}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
    Object.values(values),
  );
}
