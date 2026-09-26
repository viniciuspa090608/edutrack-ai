import type { StudyTask } from '@study-platform/contracts';
export function progressLabel(
  task: Pick<
    StudyTask,
    'subtaskTotal' | 'subtaskCompleted' | 'progressPercent'
  >,
) {
  if (!task.subtaskTotal || task.progressPercent === null) return '';
  const rounded = Math.round(task.progressPercent * 10) / 10;
  return task.subtaskCompleted < task.subtaskTotal && rounded >= 100
    ? 'menos de 100%'
    : task.subtaskCompleted > 0 && rounded === 0
      ? 'mais de 0%'
      : `${rounded.toLocaleString('pt-BR')}%`;
}
export function TaskProgress({ task }: { task: StudyTask }) {
  if (!task.subtaskTotal || task.progressPercent === null) return null;
  const text = `${task.subtaskCompleted} de ${task.subtaskTotal} subtarefas concluídas (${progressLabel(task)})`;
  return (
    <div className="task-progress">
      <p>{text}</p>
      <progress
        max={100}
        value={task.progressPercent}
        aria-label="Progresso da tarefa"
        aria-valuetext={text}
      >
        {text}
      </progress>
    </div>
  );
}
