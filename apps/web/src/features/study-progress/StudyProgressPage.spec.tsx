import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { studyAchievementCatalog } from '@study-platform/contracts';
import { StudyProgressPage } from './StudyProgressPage.js';
import { StudyTimeZoneSection } from './StudyTimeZoneSection.js';
import { setTheme } from '../../app/theme.js';
import {
  saveStudyTimeZone,
  studyProgress,
  studyTimeZone,
} from './progress-api.js';
vi.mock('./progress-api.js', () => ({
  studyProgress: vi.fn(),
  studyTimeZone: vi.fn(),
  saveStudyTimeZone: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  document.documentElement.classList.remove('dark');
});
it('preserves ended streak history and distinguishes partial, locked and granted milestones in both themes', async () => {
  vi.mocked(studyProgress).mockResolvedValue({
    ...data,
    timeZone: 'America/Sao_Paulo',
    activeDays: 9,
    longestStreak: 7,
    achievements: data.achievements.map((item, index) => ({
      ...item,
      progress: index === 0 ? 9 : index === 4 ? 3 : index === 2 ? 7 : 0,
      earnedAt: index === 0 ? '2026-10-01T01:00:00.000Z' : null,
    })),
  });
  render(<StudyProgressPage />);
  await screen.findByText('Primeiro dia');
  const summary = document.querySelector('.progress-summary')!;
  expect(summary.textContent).toContain('Sequência atual0 dias');
  expect(summary.textContent).toContain('Maior sequência7 dias');
  expect(summary.textContent).toContain('Dias ativos9');
  expect(screen.queryByText(/Seu primeiro dia ativo/)).toBeNull();
  for (const item of data.achievements) {
    expect(screen.getByText(item.criterion)).toBeTruthy();
  }
  const partial = screen.getByText('Foco consistente').closest('li')!;
  expect(within(partial).getByText('Em progresso')).toBeTruthy();
  const bar = within(partial).getByRole('progressbar', {
    name: 'Progresso: 3 de 5',
  });
  expect(bar.getAttribute('aria-valuenow')).toBe('3');
  expect(bar.getAttribute('aria-valuemax')).toBe('5');
  const granted = screen.getByText('Primeiro dia').closest('li')!;
  expect(within(granted).getByText('Obtida')).toBeTruthy();
  expect(granted.querySelector('time')?.textContent).toBe('30 de set. de 2026');
  expect(
    within(granted).getByRole('progressbar').getAttribute('aria-valuenow'),
  ).toBe('1');
  expect(
    within(screen.getByText('Sete dias seguidos').closest('li')!).getByText(
      'Em progresso',
    ),
  ).toBeTruthy();
  expect(
    within(screen.getByText('Tarefas em dia').closest('li')!).getByText(
      'Bloqueada',
    ),
  ).toBeTruthy();
  setTheme('dark');
  expect(document.documentElement.classList.contains('dark')).toBe(true);
  expect(within(partial).getByRole('progressbar')).toBe(bar);
  setTheme('light');
  expect(studyProgress).toHaveBeenCalledTimes(1);
});

it('keeps all criteria visible when no grants exist even with partial activity', async () => {
  vi.mocked(studyProgress).mockResolvedValue({
    ...data,
    activeDays: 1,
    achievements: data.achievements.map((item) => ({
      ...item,
      progress: item.code === 'FIVE_POMODORO_BLOCKS' ? 2 : 0,
    })),
  });
  render(<StudyProgressPage />);
  expect(
    await screen.findByText('Nenhuma conquista obtida ainda'),
  ).toBeTruthy();
  expect(screen.getAllByRole('progressbar')).toHaveLength(7);
  expect(screen.getByText('Em progresso')).toBeTruthy();
  expect(screen.getAllByText('Bloqueada')).toHaveLength(6);
});

it('shows timezone load retry, explicit suggestion, busy, save error and successful retry', async () => {
  vi.mocked(studyTimeZone)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(settings);
  let rejectSave!: (reason: Error) => void;
  vi.mocked(saveStudyTimeZone)
    .mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectSave = reject;
        }),
    )
    .mockResolvedValueOnce(settings);
  render(<StudyTimeZoneSection />);
  await screen.findByRole('alert');
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('button', { name: 'Tentar carregar fuso novamente' }),
  );
  const input = await screen.findByLabelText('Fuso IANA');
  await user.click(
    screen.getByRole('button', { name: 'Usar sugestão no campo' }),
  );
  expect(saveStudyTimeZone).not.toHaveBeenCalled();
  await user.click(
    screen.getByRole('button', { name: 'Salvar fuso de estudo' }),
  );
  expect(input.hasAttribute('disabled')).toBe(true);
  expect(
    screen
      .getByRole('button', { name: 'Salvando fuso…' })
      .hasAttribute('disabled'),
  ).toBe(true);
  rejectSave(new Error('invalid'));
  expect(await screen.findByRole('alert')).toBeTruthy();
  await user.click(
    screen.getByRole('button', { name: 'Salvar fuso de estudo' }),
  );
  expect(
    await screen.findByText(/As datas já registradas foram preservadas/),
  ).toBeTruthy();
});
const settings = {
  timeZone: 'UTC',
  trackingStartedAt: '2026-09-27T12:00:00.000Z',
};
const data = {
  ...settings,
  today: '2026-10-01',
  currentStreak: 0,
  longestStreak: 0,
  activeDays: 0,
  achievements: studyAchievementCatalog.map((item) => ({
    ...item,
    progress: 0,
    earnedAt: null,
  })),
};
it('shows loading, failure with keyboard retry, empty history and all seven criteria', async () => {
  vi.mocked(studyProgress).mockImplementationOnce(() => new Promise(() => {}));
  const first = render(<StudyProgressPage />);
  expect(screen.getByRole('status').textContent).toContain('Carregando');
  first.unmount();
  vi.mocked(studyProgress)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(data);
  render(<StudyProgressPage />);
  expect(await screen.findByRole('alert')).toBeTruthy();
  const user = userEvent.setup();
  screen.getByRole('button', { name: 'Tentar novamente' }).focus();
  await user.keyboard('{Enter}');
  expect(await screen.findByText(/Seu primeiro dia ativo/)).toBeTruthy();
  expect(screen.getAllByRole('progressbar')).toHaveLength(7);
  expect(screen.getByText(/Atividades anteriores não contam/)).toBeTruthy();
});
it('keeps earned achievements visible with dates and accessible progress', async () => {
  vi.mocked(studyProgress).mockResolvedValue({
    ...data,
    activeDays: 1,
    currentStreak: 1,
    longestStreak: 1,
    achievements: data.achievements.map((item, index) => ({
      ...item,
      progress: index === 0 ? 1 : 0,
      earnedAt: index === 0 ? settings.trackingStartedAt : null,
    })),
  });
  render(<StudyProgressPage />);
  expect(await screen.findByText(/Obtida em/)).toBeTruthy();
  expect(
    screen
      .getByRole('link', { name: 'Editar fuso na conta' })
      .getAttribute('href'),
  ).toBe('/conta');
  expect(
    screen.getByRole('progressbar', { name: 'Progresso: 1 de 1' }),
  ).toBeTruthy();
});
it('never saves the browser suggestion automatically and persists an explicit keyboard submission', async () => {
  vi.mocked(studyTimeZone).mockResolvedValue(settings);
  vi.mocked(saveStudyTimeZone).mockResolvedValue({
    ...settings,
    timeZone: 'America/Sao_Paulo',
  });
  render(<StudyTimeZoneSection />);
  const input = await screen.findByLabelText('Fuso IANA');
  expect(saveStudyTimeZone).not.toHaveBeenCalled();
  const user = userEvent.setup();
  await user.clear(input);
  await user.type(input, 'America/Sao_Paulo');
  screen.getByRole('button', { name: 'Salvar fuso de estudo' }).focus();
  await user.keyboard('{Enter}');
  await waitFor(() =>
    expect(saveStudyTimeZone).toHaveBeenCalledWith('America/Sao_Paulo'),
  );
  expect(await screen.findByText(/Fuso de estudo salvo/)).toBeTruthy();
});
