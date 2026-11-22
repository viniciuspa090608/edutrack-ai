import type {
  SubjectGoal,
  SubjectInsight,
  SubjectInsights,
  GoalIndicator,
} from '@study-platform/contracts';
import { Temporal } from '@js-temporal/polyfill';
import { localDate, midnight } from '../analytics/calendar.js';

export interface SubjectEvidence {
  tasks: {
    total: number;
    completed: number;
    pending: number;
    soon: number;
    overdue: number;
    recent: number;
  } | null;
  study: { hours: number; recentHours: number; intervals: number } | null;
  reviews: {
    total: number;
    good: number;
    recentTotal: number;
    recentGood: number;
    previousTotal: number;
    previousGood: number;
  } | null;
}
const dayMs = 86400000;
const n = (value: number) =>
  value > 0 && value < 0.01
    ? 'menos de 0,01'
    : value < 100 && value > 99.99
      ? 'menos de 100'
      : value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
export function goalWindow(goal: SubjectGoal | null, now: Date) {
  const start = goal
    ? new Date(goal.startedAt)
    : new Date(now.getTime() - 14 * dayMs);
  return {
    start,
    recentStart: new Date(Math.max(start.getTime(), now.getTime() - 7 * dayMs)),
    trendStart: new Date(now.getTime() - 7 * dayMs),
    previousStart: new Date(now.getTime() - 14 * dayMs),
  };
}
export function calculateSubjectInsights(
  goal: SubjectGoal | null,
  availableIndicators: GoalIndicator[],
  evidence: SubjectEvidence,
  now: Date,
  subjectId: string,
): SubjectInsights {
  const insights: SubjectInsight[] = [];
  const actionFor = (indicator: GoalIndicator) => ({
    label:
      indicator === 'tasks'
        ? 'Abrir tarefas da disciplina'
        : indicator === 'studyHours'
          ? 'Iniciar sessão de foco'
          : 'Revisar flashcards da disciplina',
    href:
      indicator === 'tasks'
        ? `/app/tarefas?subjectId=${subjectId}`
        : indicator === 'studyHours'
          ? `/app/pomodoro?subjectId=${subjectId}`
          : `/app/flashcards?subjectId=${subjectId}`,
  });
  const add = (
    code: string,
    information: string,
    detail: string,
    suggestion: string,
    indicator?: GoalIndicator,
  ) =>
    insights.push({
      code,
      information,
      evidence: detail,
      suggestion,
      action: indicator ? actionFor(indicator) : null,
    });
  let progress: SubjectInsights['progress'] = null;
  if (!goal)
    add(
      'no_goal',
      'Defina uma meta para acompanhar seu avanço.',
      'Esta disciplina ainda não tem uma meta mensurável.',
      'Escolha um indicador, um valor desejado e um prazo.',
    );
  else {
    const today = localDate(now, goal.timeZone);
    const deadline = Temporal.PlainDate.from(goal.dueDate);
    const daysLeft = Math.max(0, today.until(deadline).days + 1);
    const until = midnight(deadline.add({ days: 1 }), goal.timeZone);
    const remainingDays = Math.max(
      0,
      (until.getTime() - now.getTime()) / dayMs,
    );
    const observedDays = Math.min(
      7,
      Math.max(0, (now.getTime() - new Date(goal.startedAt).getTime()) / dayMs),
    );
    const available = availableIndicators.includes(goal.indicator);
    const current = !available
      ? null
      : goal.indicator === 'tasks'
        ? evidence.tasks!.completed
        : goal.indicator === 'studyHours'
          ? evidence.study!.hours
          : evidence.reviews!.total
            ? (evidence.reviews!.good / evidence.reviews!.total) * 100
            : null;
    const remaining =
      current === null ? null : Math.max(0, goal.target - current);
    const achieved = current !== null && current >= goal.target;
    const expired = now >= until;
    const state = !available
      ? 'unavailable'
      : achieved
        ? 'achieved'
        : expired
          ? 'expired'
          : current === null ||
              (goal.indicator === 'studyHours' && !evidence.study!.intervals) ||
              (goal.indicator === 'tasks' && !evidence.tasks!.total)
            ? 'no_data'
            : current === 0
              ? 'no_progress'
              : 'active';
    const unit =
      goal.indicator === 'tasks'
        ? 'tarefas'
        : goal.indicator === 'studyHours'
          ? 'horas de foco'
          : '% de acertos nas revisões';
    const detail = `${current === null ? 'Sem medida disponível' : `${n(current)} de ${n(goal.target)} ${unit}`}. Prazo inclusivo: ${goal.dueDate} (${goal.timeZone}); ${daysLeft} dia(s) de calendário restante(s).`;
    progress = {
      current,
      remaining,
      percent:
        current === null ? null : Math.min(100, (current / goal.target) * 100),
      daysLeft,
      state,
      currentPerDay: null,
      requiredPerDay: null,
      observedDays,
    };
    if (!available)
      add(
        'unavailable',
        'O indicador da meta está desabilitado.',
        'A meta foi preservada e os dados desse módulo não foram consultados.',
        'Reative o módulo nas preferências ou edite o indicador.',
      );
    else {
      const title = achieved
        ? 'Você alcançou o valor da sua meta.'
        : expired
          ? 'O prazo da meta terminou.'
          : state === 'no_data'
            ? 'Ainda não há registros para acompanhar esta meta.'
            : state === 'no_progress'
              ? 'Sua meta ainda está sem progresso.'
              : `Você avançou ${n(current!)} de ${n(goal.target)} ${unit}.`;
      add(
        'goal',
        title,
        detail,
        achieved
          ? 'Revise o resultado e ajuste sua próxima meta quando fizer sentido.'
          : expired
            ? 'Revise o valor desejado e escolha um novo prazo possível.'
            : goal.indicator === 'reviewAccuracy'
              ? 'Faça uma revisão e registre sua resposta com atenção.'
              : `Restam ${n(remaining ?? goal.target)} ${unit}. Escolha um próximo passo pequeno.`,
        goal.indicator,
      );
      if (goal.indicator === 'tasks')
        add(
          'execution',
          'Concluir tarefas mede execução e organização.',
          `${evidence.tasks!.completed} concluída(s) e ${evidence.tasks!.pending} pendente(s), incluindo tarefas anteriores à meta.`,
          'Combine essa organização com revisões para verificar o que você recorda.',
          'tasks',
        );
      if (goal.indicator === 'studyHours')
        add(
          'study_basis',
          'O tempo considera somente foco registrado.',
          `${n(evidence.study!.hours)} h em intervalos reais de sessões encerradas desde ${goal.startedAt}; pausas e sessões em andamento ficam de fora.`,
          'Encerre a sessão para incorporar o tempo ao progresso.',
          'studyHours',
        );
      if (goal.indicator === 'reviewAccuracy')
        add(
          'review_basis',
          'Acertos refletem suas autoavaliações de revisão.',
          `${evidence.reviews!.good} resposta(s) GOOD/EASY em ${evidence.reviews!.total} revisão(ões) desde o início da meta. HARD/AGAIN não contam como acerto; isso não estima notas.`,
          'Revise também os cartões em que houve dificuldade.',
          'reviewAccuracy',
        );
      if (!achieved && !expired && goal.indicator !== 'reviewAccuracy') {
        const recent =
          goal.indicator === 'tasks'
            ? evidence.tasks!.recent
            : evidence.study!.recentHours;
        progress.requiredPerDay = (remaining ?? goal.target) / remainingDays;
        if (observedDays < 1 || recent === 0)
          add(
            'insufficient_pace',
            'Há poucos dados para estimar o cumprimento da meta.',
            `${n(observedDays)} dia(s) observado(s), ${n(recent)} ${unit} nos últimos até 7 dias. Necessário: ${n(progress.requiredPerDay)} ${unit}/dia.`,
            'Registre novos avanços para comparar o ritmo com mais segurança.',
            goal.indicator,
          );
        else {
          progress.currentPerDay = recent / observedDays;
          const below = progress.currentPerDay < progress.requiredPerDay;
          add(
            'pace',
            below
              ? 'Seu ritmo recente está abaixo do necessário para o prazo.'
              : 'Seu ritmo recente é compatível com o prazo.',
            `${n(recent)} ${unit} / ${n(observedDays)} dia(s) = ${n(progress.currentPerDay)}/dia; restante / dias de 24 h até o fim do prazo = ${n(progress.requiredPerDay)}/dia. Estimativa, não garantia.`,
            below
              ? 'Reserve um próximo bloco ou ajuste valor e prazo à sua disponibilidade.'
              : 'Mantenha o ritmo e acompanhe os próximos registros.',
            goal.indicator,
          );
        }
      }
    }
  }
  if (evidence.tasks) {
    if (goal?.indicator !== 'tasks')
      add(
        'task_summary',
        evidence.tasks.total
          ? 'Veja como estão suas tarefas nesta disciplina.'
          : 'Ainda não há tarefas vinculadas a esta disciplina.',
        `${evidence.tasks.completed} concluída(s) e ${evidence.tasks.pending} pendente(s). Isso mede execução e organização, sem estimar notas.`,
        'Escolha uma tarefa pendente ou registre o próximo passo.',
        'tasks',
      );
    if (evidence.tasks.soon)
      add(
        'due_soon',
        `Há ${evidence.tasks.soon} tarefa(s) próxima(s) do vencimento.`,
        `${evidence.tasks.soon} tarefa(s) pendente(s) com prazo entre hoje e os próximos 7 dias nesta disciplina.`,
        'Escolha a tarefa com o prazo mais próximo.',
        'tasks',
      );
    if (evidence.tasks.overdue)
      add(
        'overdue_tasks',
        `Há ${evidence.tasks.overdue} tarefa(s) com prazo vencido.`,
        'São tarefas ainda pendentes desta disciplina, com prazo anterior a hoje.',
        'Revise as prioridades e os prazos dessas tarefas.',
        'tasks',
      );
  }
  if (evidence.study && goal?.indicator !== 'studyHours')
    add(
      'study_summary',
      evidence.study.intervals
        ? 'Você tem tempo de foco registrado nesta disciplina.'
        : 'Ainda não há tempo de foco registrado nesta janela.',
      `${n(evidence.study.hours)} h em sessões encerradas ${goal ? `desde ${goal.startedAt}` : 'nos últimos 14 dias'}. Somente intervalos ativos; pausas não contam.`,
      'Reserve um bloco de foco para o próximo assunto e encerre a sessão para registrar o tempo.',
      'studyHours',
    );
  if (evidence.reviews) {
    const r = evidence.reviews;
    if (r.recentTotal < 5 || r.previousTotal < 5)
      add(
        'insufficient_trend',
        'Há poucos dados para avaliar uma tendência de acertos.',
        `${r.recentTotal} revisão(ões) nos últimos 7 dias e ${r.previousTotal} nos 7 dias anteriores. São necessárias ao menos 5 em cada janela.`,
        'Continue revisando para formar uma comparação mais útil.',
        'reviewAccuracy',
      );
    else {
      const current = (r.recentGood / r.recentTotal) * 100,
        previous = (r.previousGood / r.previousTotal) * 100;
      add(
        'review_trend',
        current > previous
          ? 'Seu percentual de acertos aumentou nas últimas revisões.'
          : current < previous
            ? 'Seu percentual de acertos diminuiu nas últimas revisões.'
            : 'Seu percentual de acertos se manteve nas últimas revisões.',
        `GOOD/EASY: ${r.recentGood}/${r.recentTotal} (${n(current)}%) nos últimos 7 dias; ${r.previousGood}/${r.previousTotal} (${n(previous)}%) nos 7 anteriores. Autoavaliações, não notas.`,
        'Retome os cartões com dificuldade e acompanhe a próxima janela.',
        'reviewAccuracy',
      );
    }
  }
  return {
    goal,
    availableIndicators,
    progress,
    insights,
    calculatedAt: now.toISOString(),
  };
}
