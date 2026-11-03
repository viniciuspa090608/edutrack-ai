import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, expect, it } from 'vitest';
import { FormModal } from '@study-platform/ui/components/ui/form-modal';

afterEach(cleanup);
function Example() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Novo registro</button>
      {open && (
        <FormModal
          title="Novo registro"
          dirty={!!value}
          busy={busy}
          onClose={() => setOpen(false)}
        >
          {(close) => (
            <>
              <label>
                Nome
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>
              <button onClick={() => setBusy(true)}>Salvar</button>
              <button onClick={close}>Cancelar</button>
            </>
          )}
        </FormModal>
      )}
    </>
  );
}
it('keeps dirty values when discard is refused and restores the opener after confirmation', async () => {
  const user = userEvent.setup();
  render(<Example />);
  const opener = screen.getByRole('button', { name: 'Novo registro' });
  await user.click(opener);
  await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Álgebra');
  await user.keyboard('{Escape}');
  expect(screen.getByRole('alertdialog')).toBeTruthy();
  await user.click(
    screen.getByRole('button', { name: 'Continuar preenchendo' }),
  );
  expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(
    'Álgebra',
  );
  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  await user.click(
    screen.getByRole('button', { name: 'Descartar alterações' }),
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(document.activeElement).toBe(opener);
});
it('closes a clean form without confirmation and prevents closing while saving', async () => {
  const user = userEvent.setup();
  render(<Example />);
  await user.click(screen.getByRole('button', { name: 'Novo registro' }));
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Novo registro' }));
  await user.click(screen.getByRole('button', { name: 'Salvar' }));
  await user.keyboard('{Escape}');
  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.queryByRole('alertdialog')).toBeNull();
});
