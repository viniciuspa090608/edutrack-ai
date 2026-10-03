import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { TaskConfirmation } from './TaskConfirmation.js';
import { Progress } from '@study-platform/ui/components/ui/progress';

afterEach(cleanup);

it('keeps confirmation open and blocks dismissal and duplicate submission while pending', async () => {
  let reject!: (error: Error) => void;
  const onConfirm = vi.fn(
    () =>
      new Promise<void>((_resolve, fail) => {
        reject = fail;
      }),
  );
  const onCancel = vi.fn();
  render(
    <TaskConfirmation
      title="Excluir cartão?"
      description="A remoção é permanente."
      action="Excluir"
      returnFocusId="trigger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  const user = userEvent.setup();
  expect(screen.getByRole('alertdialog').getAttribute('aria-describedby')).toBe(
    'subtask-confirm-description',
  );
  await user.click(screen.getByRole('button', { name: 'Excluir' }));
  await user.keyboard('{Escape}');
  await user.click(screen.getByRole('button', { name: 'Aguarde…' }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onCancel).not.toHaveBeenCalled();
  reject(new Error('Falha de rede'));
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'Falha de rede',
  );
  expect(screen.getByRole('alertdialog')).toBeTruthy();
  await user.keyboard('{Escape}');
  await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
});

it('uses the actual achievement maximum for visual progress and accessible values', () => {
  render(<Progress value={3} max={5} aria-label="Conquistas" />);
  const progress = screen.getByRole('progressbar', { name: 'Conquistas' });
  expect(progress.getAttribute('aria-valuenow')).toBe('3');
  expect(progress.getAttribute('aria-valuemax')).toBe('5');
  expect(
    progress.querySelector<HTMLElement>('[data-slot="progress-indicator"]')
      ?.style.transform,
  ).toBe('translateX(-40%)');
});
