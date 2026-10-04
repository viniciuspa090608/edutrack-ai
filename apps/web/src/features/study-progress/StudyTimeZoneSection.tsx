import {
  CardHeader,
  Card,
  CardContent,
} from '@study-platform/ui/components/ui/card';
import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import { Globe } from 'lucide-react';
import { ProgressLoading } from './ProgressPresentation.js';
import '../../styles/study-progress.css';

import { Button } from '@study-platform/ui/components/ui/button';
import { Label } from '@study-platform/ui/components/ui/label';
import { Input } from '@study-platform/ui/components/ui/input';
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
    <Card asChild>
      <section
        className="account-card study-timezone evolution-surface evolution-card"
        aria-labelledby="study-timezone-title"
      >
        <CardHeader>
          <span className="evolution-icon">
            <Globe aria-hidden="true" />
          </span>
          <h2 id="study-timezone-title">Fuso de estudo</h2>
        </CardHeader>
        <CardContent>
          <p>
            O padrão é UTC. Cada atividade mantém a data local do fuso vigente
            quando aconteceu. Alterações valem para novas atividades.
          </p>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!settings ? (
            error ? (
              <Button onClick={() => setRetry((value) => value + 1)}>
                Tentar carregar fuso novamente
              </Button>
            ) : (
              <ProgressLoading>Carregando fuso…</ProgressLoading>
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
              <Label htmlFor="study-timezone">Fuso IANA</Label>
              <Input
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
              <div className="study-timezone-actions">
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => setDraft(suggestion)}
                >
                  Usar sugestão no campo
                </Button>
                <Button disabled={busy}>
                  {busy ? 'Salvando fuso…' : 'Salvar fuso de estudo'}
                </Button>
              </div>
              <p role="status">{message}</p>
            </form>
          )}
        </CardContent>
      </section>
    </Card>
  );
}
