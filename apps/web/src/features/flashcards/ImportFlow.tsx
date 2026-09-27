import { useEffect, useRef, useState } from 'react';
import { importMaxBytes, mappingForColumns } from '@study-platform/contracts';
import type {
  ImportAttempt,
  ImportFormat,
  ImportResult,
} from '@study-platform/contracts';
import { AuthApiError } from '../auth/auth-api.js';
import {
  uploadImport,
  previewImport,
  confirmImport,
  getImport,
  cancelImport,
} from './import-api.js';
function Counts({ counts }: { counts: ImportResult['counts'] }) {
  return (
    <dl className="import-counts">
      <div>
        <dt>Importados</dt>
        <dd>{counts.imported}</dd>
      </div>
      <div>
        <dt>Ignorados por duplicidade</dt>
        <dd>{counts.ignored}</dd>
      </div>
      <div>
        <dt>Rejeitados por erro</dt>
        <dd>{counts.rejected}</dd>
      </div>
      <div>
        <dt>Registros</dt>
        <dd>{counts.records}</dd>
      </div>
    </dl>
  );
}
function Errors({ errors }: { errors: ImportResult['errors'] }) {
  return errors.length ? (
    <section aria-label="Linhas rejeitadas">
      <h4>Linhas rejeitadas</h4>
      <ul>
        {errors.map((error) => (
          <li key={error.line}>
            Linha {error.line}: {error.reason}
          </li>
        ))}
      </ul>
    </section>
  ) : null;
}
export function ImportFlow({
  deckId,
  onClose,
  onImported,
}: {
  deckId: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ImportFormat>('csv');
  const [attempt, setAttempt] = useState<ImportAttempt | null>(null);
  const [frontColumn, setFront] = useState(0),
    [backColumn, setBack] = useState(1);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false),
    [mapping, setMapping] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const submitting = useRef(false),
    active = useRef(true),
    heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [attempt?.state, mapping]);
  async function run(work: () => Promise<void>) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await work();
    } catch (cause) {
      if (active.current) {
        if (
          cause instanceof AuthApiError &&
          (cause.status === 410 || cause.status === 404)
        )
          setUnavailable(true);
        const messages: Record<string, string> = {
          IMPORT_EXPIRED: 'A tentativa expirou. Envie o arquivo novamente.',
          IMPORT_NOT_FOUND:
            'Baralho ou tentativa não encontrado. Atualize a página ou envie novamente.',
          INVALID_IMPORT_FILE:
            'Arquivo inválido. Verifique UTF-8, cabeçalho, aspas, delimitador, até 1.000 registros e 100 colunas.',
          IMPORT_TOO_LARGE: 'O arquivo deve ter no máximo 2 MiB.',
          PAYLOAD_TOO_LARGE: 'O arquivo deve ter no máximo 2 MiB.',
          MODULE_DISABLED: 'Reative flashcards nas preferências para importar.',
          INVALID_IMPORT_MAPPING:
            'Selecione duas colunas distintas do cabeçalho.',
        };
        setError(
          cause instanceof AuthApiError && messages[cause.code]
            ? messages[cause.code]!
            : cause instanceof Error
              ? cause.message
              : 'Não foi possível concluir. Tente novamente.',
        );
      }
    } finally {
      submitting.current = false;
      if (active.current) setBusy(false);
    }
  }
  function accept(result: ImportAttempt) {
    if (!active.current) return;
    setAttempt(result);
    if (result.state === 'completed') {
      setFile(null);
      setUncertain(false);
      setMapping(false);
      onImported();
    }
  }
  return (
    <section
      className="flashcard-panel import-flow"
      aria-label="Importar flashcards"
    >
      <h3 ref={heading} tabIndex={-1}>
        {attempt?.state === 'completed'
          ? 'Resultado da importação'
          : 'Importar CSV ou TSV'}
      </h3>
      <p>
        UTF-8, cabeçalho obrigatório, até 2 MiB, 1.000 registros e 100 colunas.
        Nenhum cartão será criado antes da confirmação. Linhas vazias e
        cabeçalho não entram nas contagens.
      </p>
      {error && <p role="alert">{error}</p>}
      {busy && <p role="status">Processando importação…</p>}
      {unavailable ? (
        <div>
          <p>Esta tentativa não está mais disponível.</p>
          <button
            onClick={() => {
              setAttempt(null);
              setUnavailable(false);
              setUncertain(false);
              setMapping(false);
              setError('');
            }}
          >
            Voltar à seleção do arquivo
          </button>
          <button onClick={onClose}>Fechar importação</button>
        </div>
      ) : !attempt ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              if (!file) throw new Error('Selecione um arquivo CSV ou TSV.');
              if (file.size > importMaxBytes)
                throw new Error('O arquivo deve ter no máximo 2 MiB.');
              accept(await uploadImport(deckId, file, format));
              setMapping(true);
            });
          }}
        >
          <fieldset disabled={busy}>
            <label htmlFor="import-format">Formato</label>
            <select
              id="import-format"
              value={format}
              onChange={(event) =>
                setFormat(event.target.value as ImportFormat)
              }
            >
              <option value="csv">CSV (vírgula)</option>
              <option value="tsv">TSV (tabulação)</option>
            </select>
            <label htmlFor="import-file">Arquivo UTF-8</label>
            <input
              id="import-file"
              type="file"
              accept=".csv,.tsv,text/csv,text/tab-separated-values"
              onChange={(event) => {
                const chosen = event.target.files?.[0] ?? null;
                setFile(chosen);
                if (chosen?.name.toLowerCase().endsWith('.tsv'))
                  setFormat('tsv');
                else if (chosen?.name.toLowerCase().endsWith('.csv'))
                  setFormat('csv');
              }}
            />
            <div className="flashcard-actions">
              <button type="submit">Enviar arquivo</button>
              <button type="button" onClick={onClose}>
                Cancelar importação
              </button>
            </div>
          </fieldset>
        </form>
      ) : attempt.state === 'completed' ? (
        <>
          <p role="status">
            Importação concluída. Estas são as contagens efetivas.
          </p>
          <Counts counts={attempt.result.counts} />
          <Errors errors={attempt.result.errors} />
          <button onClick={onClose}>Fechar resultado</button>
        </>
      ) : (
        <>
          <p>
            Tentativa válida até{' '}
            {new Date(attempt.expiresAt).toLocaleTimeString()}.{' '}
            {attempt.records} registros reconhecidos.
          </p>
          {uncertain ? (
            <div>
              <p>
                A resposta da confirmação não chegou. Consulte o estado final
                antes de tentar novamente.
              </p>
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const current = await getImport(deckId, attempt.id);
                    accept(current);
                    setUncertain(false);
                  })
                }
              >
                Consultar estado final
              </button>
            </div>
          ) : mapping || attempt.state === 'uploaded' ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  const parsed = mappingForColumns(
                    attempt.columns.length,
                  ).safeParse({ frontColumn, backColumn });
                  if (!parsed.success)
                    throw new Error(
                      'Selecione duas colunas distintas do cabeçalho.',
                    );
                  accept(await previewImport(deckId, attempt.id, parsed.data));
                  setMapping(false);
                });
              }}
            >
              <fieldset disabled={busy}>
                {(['front', 'back'] as const).map((side) => (
                  <div key={side}>
                    <label htmlFor={`import-${side}`}>
                      {side === 'front'
                        ? 'Coluna da frente'
                        : 'Coluna do verso'}
                    </label>
                    <select
                      id={`import-${side}`}
                      value={side === 'front' ? frontColumn : backColumn}
                      onChange={(event) =>
                        (side === 'front' ? setFront : setBack)(
                          Number(event.target.value),
                        )
                      }
                    >
                      {attempt.columns.map((column, index) => (
                        <option key={index} value={index}>
                          {index + 1}: {column || 'Sem nome'}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <button type="submit">Pré-visualizar</button>
              </fieldset>
            </form>
          ) : attempt.state === 'preview' ? (
            <>
              <h4>Contagens previstas</h4>
              <Counts counts={attempt.preview.counts} />
              <p>
                Duplicatas são comparadas sem diferenças de caixa ou espaços
                externos. As contagens podem mudar se o baralho for editado
                antes da confirmação.
              </p>
              <table>
                <caption>Amostra de até 20 registros</caption>
                <thead>
                  <tr>
                    <th scope="col">Linha</th>
                    <th scope="col">Frente</th>
                    <th scope="col">Verso</th>
                    <th scope="col">Situação prevista</th>
                  </tr>
                </thead>
                <tbody>
                  {attempt.preview.sample.map((row) => (
                    <tr key={row.line}>
                      <th scope="row">{row.line}</th>
                      <td>{row.front}</td>
                      <td>{row.back}</td>
                      <td>
                        {row.status === 'imported'
                          ? 'Importável'
                          : row.status === 'ignored'
                            ? 'Duplicata ignorada'
                            : 'Rejeitada'}
                        {row.reason && <p>{row.reason}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Errors errors={attempt.preview.errors} />
              <div className="flashcard-actions">
                <button
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      try {
                        accept(await confirmImport(deckId, attempt.id));
                      } catch (cause) {
                        if (active.current) setUncertain(true);
                        throw cause;
                      }
                    })
                  }
                >
                  Confirmar importação
                </button>
                <button disabled={busy} onClick={() => setMapping(true)}>
                  Voltar ao mapeamento
                </button>
              </div>
            </>
          ) : null}
          {!uncertain && (
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await cancelImport(deckId, attempt.id);
                  setFile(null);
                  onClose();
                })
              }
            >
              Cancelar importação
            </button>
          )}
          {error && (
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  accept(await getImport(deckId, attempt.id));
                })
              }
            >
              Consultar tentativa
            </button>
          )}
        </>
      )}
    </section>
  );
}
