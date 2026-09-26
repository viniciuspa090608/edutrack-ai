import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import type { StudyRoutine } from '@study-platform/contracts';
import { RoutinesPage } from './RoutinesPage.js';
import { App } from '../../app/App.js';
import { AuthApiError, currentUser } from '../auth/auth-api.js';
import { preferences } from '../profile/profile-api.js';
import * as api from './routines-api.js';
vi.mock('./routines-api.js');
vi.mock('../auth/auth-api.js', async (original) => ({
  ...(await original<typeof import('../auth/auth-api.js')>()),
  currentUser: vi.fn(),
}));
vi.mock('../profile/profile-api.js');
const row: StudyRoutine = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Álgebra',
  timeZone: 'Europe/Lisbon',
  slots: [
    { weekday: 1, startTime: '08:00', endTime: '09:00' },
    { weekday: 3, startTime: '19:00', endTime: '20:30' },
  ],
  createdAt: '2026-09-26T12:00:00.000Z',
  updatedAt: '2026-09-26T12:00:00.000Z',
};
let items: StudyRoutine[];
beforeEach(() => {
  vi.resetAllMocks();
  items = [];
  vi.mocked(api.listRoutines).mockImplementation(async () => ({
    items,
    page: 1,
    pageSize: 20,
    total: items.length,
    totalPages: items.length ? 1 : 0,
  }));
  vi.mocked(api.routineSchedule).mockImplementation(async () => ({
    items: items
      .flatMap((item) =>
        item.slots.map((slot) => ({
          routineId: item.id,
          name: item.name,
          timeZone: item.timeZone,
          ...slot,
        })),
      )
      .sort(
        (a, b) =>
          a.weekday - b.weekday || a.startTime.localeCompare(b.startTime),
      ),
  }));
  vi.mocked(api.routineDetail).mockResolvedValue(row);
  vi.mocked(api.saveRoutine).mockImplementation(async (id, input) => {
    const value = {
      ...row,
      name: input.name ?? row.name,
      timeZone: input.timeZone ?? row.timeZone,
      slots: input.slots ?? row.slots,
    };
    items = [value];
    return value;
  });
  vi.mocked(api.deleteRoutine).mockImplementation(async () => {
    items = [];
  });
});
afterEach(cleanup);
it('protects direct routes and preserves return path', async () => {
  window.history.replaceState({}, '', '/app/rotinas');
  vi.mocked(currentUser).mockRejectedValue(
    new AuthApiError(401, 'UNAUTHENTICATED'),
  );
  render(<App />);
  await waitFor(() => expect(window.location.pathname).toBe('/acesso'));
  expect(new URLSearchParams(window.location.search).get('returnTo')).toBe(
    '/app/rotinas',
  );
});
it('renders authenticated routines independently of tasks preferences', async () => {
  window.history.replaceState({}, '', '/app/rotinas');
  vi.mocked(currentUser).mockResolvedValue({
    id: row.id,
    email: 'a@example.com',
    googleLinked: true,
  });
  vi.mocked(preferences).mockResolvedValue({
    tasks: false,
    subjects: true,
    flashcards: false,
    ai: false,
  });
  render(<App />);
  await screen.findByText(/Nenhuma rotina cadastrada/);
  expect(
    screen.getByRole('link', { name: 'Rotinas' }).getAttribute('href'),
  ).toBe('/app/rotinas');
});
it('creates and removes schedule rows by keyboard and refreshes the weekly view', async () => {
  const user = userEvent.setup();
  render(<RoutinesPage />);
  await screen.findByText(/Nenhuma rotina cadastrada/);
  const create = screen.getByRole('button', { name: 'Criar rotina' });
  create.focus();
  await user.keyboard('{Enter}');
  expect(document.activeElement).toBe(
    screen.getByRole('textbox', { name: 'Nome' }),
  );
  await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Matemática');
  fireEvent.change(screen.getByRole('textbox', { name: 'Fuso horário' }), {
    target: { value: 'America/Sao_Paulo' },
  });
  await user.click(screen.getByRole('button', { name: 'Adicionar horário' }));
  const second = screen.getByRole('group', { name: 'Horário 2' });
  fireEvent.change(within(second).getByRole('combobox'), {
    target: { value: '3' },
  });
  fireEvent.change(within(second).getByLabelText('Início'), {
    target: { value: '19:00' },
  });
  fireEvent.change(within(second).getByLabelText('Fim'), {
    target: { value: '20:30' },
  });
  await user.click(screen.getByRole('button', { name: 'Adicionar horário' }));
  await user.click(screen.getByRole('button', { name: 'Remover horário 3' }));
  await user.click(screen.getByRole('button', { name: 'Salvar rotina' }));
  await screen.findByText('Rotina salva.');
  expect(api.saveRoutine).toHaveBeenCalledWith(null, {
    name: 'Matemática',
    timeZone: 'America/Sao_Paulo',
    slots: row.slots,
  });
  expect(
    within(screen.getByRole('region', { name: 'Quarta-feira' })).getByText(
      '19:00–20:30',
    ),
  ).toBeTruthy();
});
it('validates overlaps locally and retains form values after a failed save', async () => {
  render(<RoutinesPage />);
  await screen.findByText(/Nenhuma rotina cadastrada/);
  fireEvent.click(screen.getByRole('button', { name: 'Criar rotina' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
    target: { value: 'Preservar' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Fuso horário' }), {
    target: { value: 'UTC' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar horário' }));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar rotina' }));
  expect(api.saveRoutine).not.toHaveBeenCalled();
  expect(screen.getByRole('alert').textContent).toContain('sobrepor');
  fireEvent.click(screen.getByRole('button', { name: 'Remover horário 2' }));
  vi.mocked(api.saveRoutine).mockRejectedValue(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar rotina' }));
  await screen.findByText(/Seus dados foram mantidos/);
  expect(
    (screen.getByRole('textbox', { name: 'Nome' }) as HTMLInputElement).value,
  ).toBe('Preservar');
  expect(screen.queryByText('Rotina salva.')).toBeNull();
});
it('edits saved local times and displays routine zones without device conversion', async () => {
  items = [row];
  render(<RoutinesPage />);
  await screen.findByRole('button', { name: 'Editar Álgebra' });
  const monday = screen.getByRole('region', { name: 'Segunda-feira' });
  expect(within(monday).getByText('08:00–09:00')).toBeTruthy();
  expect(within(monday).getByText('Fuso: Europe/Lisbon')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Editar Álgebra' }));
  await screen.findByRole('textbox', { name: 'Nome' });
  fireEvent.change(screen.getByRole('textbox', { name: 'Fuso horário' }), {
    target: { value: 'Asia/Tokyo' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar rotina' }));
  await screen.findByText('Rotina salva.');
  expect(api.saveRoutine).toHaveBeenCalledWith(row.id, {
    name: row.name,
    timeZone: 'Asia/Tokyo',
    slots: row.slots,
  });
  expect(
    within(screen.getByRole('region', { name: 'Segunda-feira' })).getByText(
      '08:00–09:00',
    ),
  ).toBeTruthy();
});
it('confirms deletion with focus and leaves data unchanged on cancel or failure', async () => {
  const user = userEvent.setup();
  items = [row];
  render(<RoutinesPage />);
  await screen.findByRole('button', { name: 'Excluir Álgebra' });
  await user.click(screen.getByRole('button', { name: 'Excluir Álgebra' }));
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Manter rotina' }),
  );
  await user.keyboard('{Enter}');
  expect(api.deleteRoutine).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Excluir Álgebra' }),
  );
  vi.mocked(api.deleteRoutine).mockRejectedValueOnce(new Error('offline'));
  await user.click(screen.getByRole('button', { name: 'Excluir Álgebra' }));
  await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
  await screen.findByText(/A programação foi mantida/);
  expect(screen.queryByText('Rotina excluída.')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
  await screen.findByText('Rotina excluída.');
  await screen.findByText(/Nenhuma rotina cadastrada/);
  expect(screen.queryByText('08:00–09:00')).toBeNull();
});
it('shows loading and recoverable errors without falsely confirming saves', async () => {
  vi.mocked(api.listRoutines).mockRejectedValueOnce(new Error('offline'));
  render(<RoutinesPage />);
  await screen.findByRole('alert');
  fireEvent.click(
    screen.getByRole('button', { name: 'Atualizar programação' }),
  );
  await screen.findByText(/Nenhuma rotina cadastrada/);
  fireEvent.click(screen.getByRole('button', { name: 'Criar rotina' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
    target: { value: 'Pendente' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Fuso horário' }), {
    target: { value: 'UTC' },
  });
  let resolve!: (value: StudyRoutine) => void;
  vi.mocked(api.saveRoutine).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Salvar rotina' }));
  expect(screen.queryByText('Rotina salva.')).toBeNull();
  expect(
    screen
      .getByRole('button', { name: 'Salvar rotina' })
      .hasAttribute('disabled'),
  ).toBe(true);
  resolve(row);
  await screen.findByText('Rotina salva.');
});
