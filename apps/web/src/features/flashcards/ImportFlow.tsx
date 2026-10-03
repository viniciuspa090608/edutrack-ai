import {
  CardHeader,
  Card,
  CardContent,
} from '@study-platform/ui/components/ui/card';
import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import { FieldSet } from '@study-platform/ui/components/ui/field';

import { Button } from '@study-platform/ui/components/ui/button';
import { Label } from '@study-platform/ui/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@study-platform/ui/components/ui/native-select';
import { Input } from '@study-platform/ui/components/ui/input';
import {
  Table,
  TableCaption,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@study-platform/ui/components/ui/table';
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
    <Card asChild>
      <section
        className="flashcard-panel import-flow"
        aria-label="Importar flashcards"
      >
        <CardHeader>
          <h3 ref={heading} tabIndex={-1}>
            {attempt?.state === 'completed'
              ? 'Resultado da importação'
              : 'Importar CSV ou TSV'}
          </h3>
        </CardHeader>
        <CardContent>
          <p>
            UTF-8, cabeçalho obrigatório, até 2 MiB, 1.000 registros e 100
            colunas. Nenhum cartão será criado antes da confirmação. Linhas
            vazias e cabeçalho não entram nas contagens.
          </p>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {busy && (
            <div>
              <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
              <p role="status">Processando importação…</p>
            </div>
          )}
          {unavailable ? (
            <div>
              <p>Esta tentativa não está mais disponível.</p>
              <Button
                onClick={() => {
                  setAttempt(null);
                  setUnavailable(false);
                  setUncertain(false);
                  setMapping(false);
                  setError('');
                }}
              >
                Voltar à seleção do arquivo
              </Button>
              <Button onClick={onClose}>Fechar importação</Button>
            </div>
          ) : !attempt ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  if (!file)
                    throw new Error('Selecione um arquivo CSV ou TSV.');
                  if (file.size > importMaxBytes)
                    throw new Error('O arquivo deve ter no máximo 2 MiB.');
                  accept(await uploadImport(deckId, file, format));
                  setMapping(true);
                });
              }}
            >
              <FieldSet disabled={busy}>
                <Label htmlFor="import-format">Formato</Label>
                <NativeSelect
                  id="import-format"
                  value={format}
                  onChange={(event) =>
                    setFormat(event.target.value as ImportFormat)
                  }
                >
                  <NativeSelectOption value="csv">
                    CSV (vírgula)
                  </NativeSelectOption>
                  <NativeSelectOption value="tsv">
                    TSV (tabulação)
                  </NativeSelectOption>
                </NativeSelect>
                <Label htmlFor="import-file">Arquivo UTF-8</Label>
                <Input
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
                  <Button type="submit">Enviar arquivo</Button>
                  <Button type="button" onClick={onClose}>
                    Cancelar importação
                  </Button>
                </div>
              </FieldSet>
            </form>
          ) : attempt.state === 'completed' ? (
            <>
              <p role="status">
                Importação concluída. Estas são as contagens efetivas.
              </p>
              <Counts counts={attempt.result.counts} />
              <Errors errors={attempt.result.errors} />
              <Button onClick={onClose}>Fechar resultado</Button>
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
                    A resposta da confirmação não chegou. Consulte o estado
                    final antes de tentar novamente.
                  </p>
                  <Button
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
                  </Button>
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
                      accept(
                        await previewImport(deckId, attempt.id, parsed.data),
                      );
                      setMapping(false);
                    });
                  }}
                >
                  <FieldSet disabled={busy}>
                    {(['front', 'back'] as const).map((side) => (
                      <div key={side}>
                        <Label htmlFor={`import-${side}`}>
                          {side === 'front'
                            ? 'Coluna da frente'
                            : 'Coluna do verso'}
                        </Label>
                        <NativeSelect
                          id={`import-${side}`}
                          value={side === 'front' ? frontColumn : backColumn}
                          onChange={(event) =>
                            (side === 'front' ? setFront : setBack)(
                              Number(event.target.value),
                            )
                          }
                        >
                          {attempt.columns.map((column, index) => (
                            <NativeSelectOption key={index} value={index}>
                              {index + 1}: {column || 'Sem nome'}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </div>
                    ))}
                    <Button type="submit">Pré-visualizar</Button>
                  </FieldSet>
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
                  <Table>
                    <TableCaption>Amostra de até 20 registros</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead scope="col">Linha</TableHead>
                        <TableHead scope="col">Frente</TableHead>
                        <TableHead scope="col">Verso</TableHead>
                        <TableHead scope="col">Situação prevista</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attempt.preview.sample.map((row) => (
                        <TableRow key={row.line}>
                          <TableHead scope="row">{row.line}</TableHead>
                          <TableCell>{row.front}</TableCell>
                          <TableCell>{row.back}</TableCell>
                          <TableCell>
                            {row.status === 'imported'
                              ? 'Importável'
                              : row.status === 'ignored'
                                ? 'Duplicata ignorada'
                                : 'Rejeitada'}
                            {row.reason && <p>{row.reason}</p>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Errors errors={attempt.preview.errors} />
                  <div className="flashcard-actions">
                    <Button
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
                    </Button>
                    <Button disabled={busy} onClick={() => setMapping(true)}>
                      Voltar ao mapeamento
                    </Button>
                  </div>
                </>
              ) : null}
              {!uncertain && (
                <Button
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
                </Button>
              )}
              {error && (
                <Button
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      accept(await getImport(deckId, attempt.id));
                    })
                  }
                >
                  Consultar tentativa
                </Button>
              )}
            </>
          )}
        </CardContent>
      </section>
    </Card>
  );
}
