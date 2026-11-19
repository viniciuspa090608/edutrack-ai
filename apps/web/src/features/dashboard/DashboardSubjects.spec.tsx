import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import type { DashboardSubjects as Page } from '@study-platform/contracts';
import { DashboardSubjects } from './DashboardSubjects.js';
import { dashboardSubjects } from '../subjects/subjects-api.js';
vi.mock('../subjects/subjects-api.js', () => ({ dashboardSubjects: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
function page(name: string, number = 1): Page {
  return {
    page: number,
    pageSize: 10,
    total: 11,
    totalPages: 2,
    items: [
      {
        id: name,
        name,
        dueDate: '2026-12-01',
        hasPending: false,
        source: 'manual',
        roadmapId: null,
        title: 'Plano manual',
        total: 0,
        completed: 0,
        progressPercent: null,
      },
    ],
  };
}
it('keeps confirmed items on failure, retries the same page and deduplicates results', async () => {
  vi.mocked(dashboardSubjects)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({
      ...page('Segunda', 2),
      items: [...page('Primeira').items, ...page('Segunda').items],
    });
  render(<DashboardSubjects initial={page('Primeira')} />);
  await userEvent.click(
    screen.getByRole('button', { name: 'Carregar mais disciplinas' }),
  );
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Primeira' })).toBeTruthy();
  await userEvent.click(
    screen.getByRole('button', { name: 'Tentar carregar mais disciplinas' }),
  );
  expect(await screen.findByRole('link', { name: 'Segunda' })).toBeTruthy();
  expect(screen.getAllByRole('link', { name: 'Primeira' })).toHaveLength(1);
  expect(dashboardSubjects).toHaveBeenNthCalledWith(1, 2);
  expect(dashboardSubjects).toHaveBeenNthCalledWith(2, 2);
  expect(screen.queryByRole('button')).toBeNull();
});
it('discards an old next-page response after refreshing the collection', async () => {
  let resolve!: (value: Page) => void;
  vi.mocked(dashboardSubjects).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const view = render(<DashboardSubjects initial={page('Anterior')} />);
  await userEvent.click(
    screen.getByRole('button', { name: 'Carregar mais disciplinas' }),
  );
  view.rerender(<DashboardSubjects initial={page('Atual')} />);
  await act(async () => resolve(page('Obsoleta', 2)));
  expect(screen.getByRole('link', { name: 'Atual' })).toBeTruthy();
  expect(screen.queryByText('Obsoleta')).toBeNull();
  expect(screen.queryByText('Anterior')).toBeNull();
});
