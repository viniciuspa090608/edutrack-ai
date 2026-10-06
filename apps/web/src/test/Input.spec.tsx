import { createRef } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { Input } from '@study-platform/ui/components/ui/input';

afterEach(cleanup);

it('toggles only a password and preserves value, selection, ref, attributes and submit', async () => {
  const ref = createRef<HTMLInputElement>();
  const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
  const user = userEvent.setup();
  render(
    <form onSubmit={submit}>
      <label htmlFor="password">Senha</label>
      <Input
        ref={ref}
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        minLength={12}
        maxLength={128}
        required
      />
      <button type="submit">Enviar</button>
    </form>,
  );
  const input = screen.getByLabelText('Senha') as HTMLInputElement;
  expect(ref.current).toBe(input);
  expect(input.type).toBe('password');
  await user.type(input, 'senha-longa-digitada');
  input.setSelectionRange(2, 6, 'forward');
  await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));
  expect(input.type).toBe('text');
  expect(input.value).toBe('senha-longa-digitada');
  expect(document.activeElement).toBe(input);
  expect([input.selectionStart, input.selectionEnd]).toEqual([2, 6]);
  expect(submit).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Ocultar senha' }));
  expect(input.type).toBe('password');
  expect(input.value).toBe('senha-longa-digitada');
  expect(input.autocomplete).toBe('current-password');
  expect(input.minLength).toBe(12);
  expect(input.maxLength).toBe(128);
  expect(input.required).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Enviar' }));
  expect(submit).toHaveBeenCalledOnce();
});

it('preserves native validation and keyboard activation without submitting', async () => {
  const user = userEvent.setup();
  render(
    <>
      <label htmlFor="new-password">Nova senha</label>
      <Input
        id="new-password"
        type="password"
        autoComplete="new-password"
        required
      />
    </>,
  );
  const input = screen.getByLabelText('Nova senha') as HTMLInputElement;
  expect(input.validity.valueMissing).toBe(true);
  await user.tab();
  await user.tab();
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Mostrar senha' }),
  );
  await user.keyboard('{Enter}');
  expect(input.type).toBe('text');
  expect(document.activeElement).toBe(input);
});

it('keeps disabled password and visibility control unavailable', async () => {
  render(
    <Input
      aria-label="Senha"
      type="password"
      disabled
      defaultValue="preservada"
    />,
  );
  const button = screen.getByRole('button', {
    name: 'Mostrar senha',
  }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  fireEvent.click(button);
  expect((screen.getByLabelText('Senha') as HTMLInputElement).type).toBe(
    'password',
  );
});

it.each([
  ['Código de confirmação', 'text', 'one-time-code'],
  ['Código de recuperação', 'text', 'one-time-code'],
  ['Código de troca de e-mail', 'text', 'one-time-code'],
  ['OTP', 'text', 'one-time-code'],
  ['Token', 'text', 'off'],
  ['PIN', 'text', 'off'],
  ['E-mail', 'email', 'email'],
  ['Texto', 'text', 'off'],
  ['Busca', 'search', 'off'],
])('does not add visibility to %s', (label, type, autoComplete) => {
  render(<Input aria-label={label} type={type} autoComplete={autoComplete} />);
  expect(screen.queryByRole('button')).toBeNull();
  expect((screen.getByLabelText(label) as HTMLInputElement).type).toBe(type);
});
