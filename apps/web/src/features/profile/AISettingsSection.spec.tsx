import { selectOption } from '../../test/select-option.js';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { aiModels } from '@study-platform/contracts';
import type {
  AICatalog,
  AISettings,
  AISettingsWrite,
} from '@study-platform/contracts';
import { AISettingsSection } from './AISettingsSection.js';
import * as api from './ai-settings-api.js';
vi.mock('./ai-settings-api.js');
const canary = 'SYNTHETIC_UI_CREDENTIAL_CANARY';
let saved: AISettings;
const catalog: AICatalog = {
  providers: Object.entries(aiModels).map(([id, models]) => ({
    id: id as AICatalog['providers'][number]['id'],
    label: id,
    models: [...models],
  })),
  limits: { userPerMinute: 5, userConcurrency: 1, platformUserDaily: 20 },
};
beforeEach(() => {
  saved = {
    mode: 'platform',
    provider: 'gemini',
    model: aiModels.gemini[0],
    hasPersonalKey: false,
    platformAvailable: true,
    revision: 0,
  };
  vi.mocked(api.readAISettings).mockImplementation(async () => saved);
  vi.mocked(api.readAICatalog).mockResolvedValue(catalog);
  vi.mocked(api.saveAISettings).mockImplementation(
    async (input: AISettingsWrite) => {
      saved = {
        ...saved,
        mode: input.mode,
        provider: input.mode === 'personal' ? input.provider : 'gemini',
        model: input.mode === 'personal' ? input.model : aiModels.gemini[0],
        hasPersonalKey: input.mode === 'personal',
        revision: saved.revision + 1,
      };
      return saved;
    },
  );
  vi.mocked(api.removeAISettings).mockImplementation(async () => {
    saved = {
      ...saved,
      mode: 'platform',
      provider: 'gemini',
      model: aiModels.gemini[0],
      hasPersonalKey: false,
      revision: saved.revision + 1,
    };
    return saved;
  });
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
async function personal() {
  const user = userEvent.setup();
  render(<AISettingsSection />);
  await screen.findByText(/Nenhuma chave pessoal salva/);
  await user.click(screen.getByLabelText('Usar minha chave pessoal'));
  return user;
}
it('announces loading, absent personal settings and unavailable platform, with recoverable load errors', async () => {
  saved.platformAvailable = false;
  vi.mocked(api.readAISettings).mockRejectedValueOnce(new Error('network'));
  const user = userEvent.setup();
  render(<AISettingsSection />);
  expect(screen.getByText(/Carregando configuração/)).toBeTruthy();
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Não foi possível carregar',
  );
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByText(/O padrão está indisponível/)).toBeTruthy();
});
it('saves an explicit personal destination with masked key, restricts dependent models, clears transient secrets and keeps secrets out of browser storage', async () => {
  const user = await personal();
  expect(screen.getByText(/Custos e cotas/)).toBeTruthy();
  await selectOption(screen.getByLabelText('Provedor de IA'), 'openai');
  await waitFor(() =>
    expect(screen.getByLabelText('Modelo de IA').textContent).toBe(
      aiModels.openai[0],
    ),
  );
  const key = screen.getByLabelText(/Chave da API/) as HTMLInputElement;
  expect(key.type).toBe('password');
  await user.type(key, canary);
  await user.click(
    screen.getByRole('button', { name: 'Salvar configuração de IA' }),
  );
  await screen.findByText(/Configuração de IA salva/);
  expect(key.value).toBe('');
  expect(api.saveAISettings).toHaveBeenCalledWith({
    mode: 'personal',
    provider: 'openai',
    model: aiModels.openai[0],
    apiKey: canary,
    revision: 0,
  });
  expect(document.body.textContent).not.toContain(canary);
  cleanup();
  render(<AISettingsSection />);
  await screen.findByText(/Chave pessoal configurada/);
  expect(
    (screen.getByLabelText(/Chave da API/) as HTMLInputElement).value,
  ).toBe('');
});
it('preserves the confirmed configuration on failure, focuses the error and clears the transient password on unmount/logout', async () => {
  const user = await personal();
  const key = screen.getByLabelText(/Chave da API/) as HTMLInputElement;
  await user.type(key, canary);
  vi.mocked(api.saveAISettings).mockRejectedValueOnce(new Error(canary));
  await user.click(
    screen.getByRole('button', { name: 'Salvar configuração de IA' }),
  );
  const error = await screen.findByRole('alert');
  expect(error.textContent).toContain('configuração confirmada foi preservada');
  expect(document.activeElement).toBe(error);
  expect(screen.getByText(/Configuração confirmada: Padrão/)).toBeTruthy();
  expect(key.value).toBe('');
  await user.type(key, canary);
  cleanup();
  expect(key.value).toBe('');
});
it('requires explicit confirmation to replace/remove and supports keyboard model-only updates without resending a key', async () => {
  saved = {
    ...saved,
    mode: 'personal',
    provider: 'openai',
    model: aiModels.openai[0],
    hasPersonalKey: true,
    revision: 2,
  };
  const user = userEvent.setup();
  render(<AISettingsSection />);
  await screen.findByText(/Chave pessoal configurada/);
  await selectOption(screen.getByLabelText('Modelo de IA'), aiModels.openai[1]);
  await user.click(
    screen.getByRole('button', { name: 'Salvar configuração de IA' }),
  );
  await waitFor(() =>
    expect(api.saveAISettings).toHaveBeenCalledWith({
      mode: 'personal',
      provider: 'openai',
      model: aiModels.openai[1],
      revision: 2,
    }),
  );
  await user.type(screen.getByLabelText(/Chave da API/), canary);
  await user.click(
    screen.getByRole('button', { name: 'Salvar configuração de IA' }),
  );
  expect(
    screen.getByRole('group', { name: 'Confirmar alteração de IA' }),
  ).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(api.saveAISettings).toHaveBeenCalledTimes(1);
  await user.click(
    screen.getByRole('button', { name: 'Remover chave e restaurar padrão' }),
  );
  expect(api.removeAISettings).not.toHaveBeenCalled();
  const confirmation = screen.getByRole('button', {
    name: 'Confirmar remoção',
  });
  confirmation.focus();
  await user.keyboard('{Enter}');
  await waitFor(() => expect(api.removeAISettings).toHaveBeenCalledWith(3));
  expect(await screen.findByText(/Nenhuma chave pessoal salva/)).toBeTruthy();
});
