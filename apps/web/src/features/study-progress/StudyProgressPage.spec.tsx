import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { studyAchievementCatalog } from '@study-platform/contracts';
import { StudyProgressPage } from './StudyProgressPage.js';
import { StudyTimeZoneSection } from './StudyTimeZoneSection.js';
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
