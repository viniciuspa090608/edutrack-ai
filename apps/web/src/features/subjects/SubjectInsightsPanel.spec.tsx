import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { SubjectInsights } from '@study-platform/contracts';
import { SubjectInsightsPanel } from './SubjectInsightsPanel.js';
import { readSubjectInsights, saveSubjectGoal } from './subject-goals-api.js';

vi.mock('./subject-goals-api.js', () => ({
  readSubjectInsights: vi.fn(),
  saveSubjectGoal: vi.fn(),
}));
const empty: SubjectInsights = {
  goal: null,
  progress: null,
  availableIndicators: ['tasks', 'studyHours', 'reviewAccuracy'],
  insights: [
    {
      code: 'no_goal',
      information: 'Defina uma meta para acompanhar seu avanço.',
      evidence: 'Sem meta nesta disciplina.',
      suggestion: 'Escolha um indicador.',
      action: null,
    },
  ],
  calculatedAt: '2026-11-22T12:00:00Z',
};
const saved: SubjectInsights = {
  ...empty,
  goal: {
    indicator: 'tasks',
    target: 10,
    dueDate: '2026-12-01',
    timeZone: 'America/Sao_Paulo',
    startedAt: empty.calculatedAt,
  },
  progress: {
    current: 6,
    percent: 60,
    remaining: 4,
    daysLeft: 10,
    state: 'active',
    currentPerDay: null,
    requiredPerDay: 0.4,
    observedDays: 0,
  },
  insights: [
    {
      code: 'goal',
      information: 'Você concluiu 6 de 10 tarefas.',
      evidence: '6 concluídas e 4 restantes.',
      suggestion: 'Escolha uma tarefa.',
      action: {
        label: 'Abrir tarefas da disciplina',
        href: '/app/tarefas?subjectId=discipline-a',
      },
    },
  ],
};
beforeEach(() => {
  vi.mocked(readSubjectInsights).mockReset().mockResolvedValue(empty);
  vi.mocked(saveSubjectGoal).mockReset().mockResolvedValue(saved);
});
afterEach(cleanup);
it('distinguishes loading, empty, evidence and action, and saves an editable goal', async () => {
  const user = userEvent.setup();
  let resolve!: (value: SubjectInsights) => void;
  vi.mocked(readSubjectInsights).mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  render(<SubjectInsightsPanel subjectId="discipline-a" />);
  expect(screen.getByText('Atualizando meta e insights…')).toBeTruthy();
  await act(async () => resolve(empty));
  expect(
    screen.getByText('Nenhuma meta definida para esta disciplina.'),
  ).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Definir meta' }));
  fireEvent.change(screen.getByLabelText('Prazo da meta'), {
    target: { value: '2026-12-01' },
  });
  await user.click(screen.getByRole('button', { name: 'Salvar meta' }));
  expect(
    await screen.findByText('Meta salva. Progresso e insights atualizados.'),
  ).toBeTruthy();
  expect(saveSubjectGoal).toHaveBeenCalledWith(
    'discipline-a',
    expect.objectContaining({
      indicator: 'tasks',
      target: 10,
      dueDate: '2026-12-01',
    }),
  );
  expect(screen.getByText('6 concluídas e 4 restantes.')).toBeTruthy();
  expect(
    screen
      .getByRole('link', { name: 'Abrir tarefas da disciplina' })
      .getAttribute('href'),
  ).toBe('/app/tarefas?subjectId=discipline-a');
  await user.click(screen.getByRole('button', { name: 'Editar meta' }));
  expect(
    (screen.getByLabelText('Valor desejado') as HTMLInputElement).value,
  ).toBe('10');
  await user.clear(screen.getByLabelText('Valor desejado'));
  await user.type(screen.getByLabelText('Valor desejado'), '12');
  await user.click(screen.getByRole('button', { name: 'Salvar meta' }));
  expect(saveSubjectGoal).toHaveBeenLastCalledWith(
    'discipline-a',
    expect.objectContaining({ target: 12 }),
  );
});
it('shows read failure with retry and preserves a failed save for correction', async () => {
  const user = userEvent.setup();
  vi.mocked(readSubjectInsights).mockRejectedValueOnce(new Error('offline'));
  vi.mocked(saveSubjectGoal).mockRejectedValueOnce(new Error('offline'));
  render(<SubjectInsightsPanel subjectId="discipline-a" />);
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Não foi possível atualizar',
  );
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await user.click(await screen.findByRole('button', { name: 'Definir meta' }));
  fireEvent.change(screen.getByLabelText('Prazo da meta'), {
    target: { value: '2026-12-01' },
  });
  await user.click(screen.getByRole('button', { name: 'Salvar meta' }));
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Não foi possível salvar',
  );
  expect(
    (screen.getByLabelText('Prazo da meta') as HTMLInputElement).value,
  ).toBe('2026-12-01');
  expect(
    screen.queryByText('Meta salva. Progresso e insights atualizados.'),
  ).not.toBeTruthy();
});
it('refreshes on focus and ignores stale responses when the discipline changes', async () => {
  let resolve!: (value: SubjectInsights) => void;
  vi.mocked(readSubjectInsights).mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const view = render(
    <SubjectInsightsPanel key="a" subjectId="discipline-a" />,
  );
  view.rerender(<SubjectInsightsPanel key="b" subjectId="discipline-b" />);
  await screen.findByText('Nenhuma meta definida para esta disciplina.');
  await act(async () => resolve(saved));
  expect(screen.queryByText('Você concluiu 6 de 10 tarefas.')).not.toBeTruthy();
  vi.mocked(readSubjectInsights).mockResolvedValue(saved);
  fireEvent.focus(window);
  expect(
    await screen.findByText('Você concluiu 6 de 10 tarefas.'),
  ).toBeTruthy();
  await waitFor(() =>
    expect(readSubjectInsights).toHaveBeenLastCalledWith('discipline-b'),
  );
});
it('preserves disabled goals and explains the absence of available indicators', async () => {
  vi.mocked(readSubjectInsights).mockResolvedValue({
    ...saved,
    availableIndicators: [],
    progress: {
      ...saved.progress!,
      state: 'unavailable',
      current: null,
      percent: null,
    },
  });
  render(<SubjectInsightsPanel subjectId="discipline-a" />);
  expect(await screen.findByText('Sem medida disponível.')).toBeTruthy();
  expect(
    (screen.getByRole('button', { name: 'Editar meta' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(
    screen.getByText(/Ative tarefas, Pomodoro ou flashcards/),
  ).toBeTruthy();
});
