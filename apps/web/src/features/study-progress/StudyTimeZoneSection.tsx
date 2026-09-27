import { useEffect, useState } from 'react';
import type { StudyTimeZoneSettings } from '@study-platform/contracts';
import { saveStudyTimeZone, studyTimeZone } from './progress-api.js';
export function StudyTimeZoneSection() {
  const [settings, setSettings] = useState<StudyTimeZoneSettings | null>(null);
  const [draft, setDraft] = useState('UTC');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [suggestion] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });
  useEffect(() => {
    let active = true;
    setError('');
    void studyTimeZone()
      .then((value) => {
        if (active) {
          setSettings(value);
          setDraft(value.timeZone);
        }
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar o fuso de estudo.');
      });
    return () => {
      active = false;
    };
  }, [retry]);
  async function save() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const value = await saveStudyTimeZone(draft);
      setSettings(value);
      setDraft(value.timeZone);
      setMessage(
        'Fuso de estudo salvo. As datas já registradas foram preservadas.',
      );
    } catch {
      setError(
        'Não foi possível salvar. Confira o fuso IANA e tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="account-card" aria-labelledby="study-timezone-title">
      <h2 id="study-timezone-title">Fuso de estudo</h2>
      <p>
        O padrão é UTC. Cada atividade mantém a data local do fuso vigente
        quando aconteceu. Alterações valem para novas atividades.
      </p>
      {error && <p role="alert">{error}</p>}
      {!settings ? (
        error ? (
          <button onClick={() => setRetry((value) => value + 1)}>
            Tentar carregar fuso novamente
          </button>
        ) : (
          <p role="status">Carregando fuso…</p>
        )
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <p>
            Fuso salvo: <strong>{settings.timeZone}</strong>
          </p>
          <label htmlFor="study-timezone">Fuso IANA</label>
          <input
            id="study-timezone"
            value={draft}
            maxLength={100}
            required
            disabled={busy}
            onChange={(event) => setDraft(event.target.value)}
            aria-describedby="study-timezone-help"
          />
          <p id="study-timezone-help">
            Exemplos: UTC, America/Sao_Paulo. Sugestão do navegador:{' '}
            {suggestion}. A sugestão só será aplicada se você salvar.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => setDraft(suggestion)}
          >
            Usar sugestão no campo
          </button>
          <button disabled={busy}>
            {busy ? 'Salvando fuso…' : 'Salvar fuso de estudo'}
          </button>
          <p role="status">{message}</p>
        </form>
      )}
    </section>
  );
}
