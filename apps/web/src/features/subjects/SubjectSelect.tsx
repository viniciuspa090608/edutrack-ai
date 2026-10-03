import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import { Label } from '@study-platform/ui/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@study-platform/ui/components/ui/native-select';

import { Button } from '@study-platform/ui/components/ui/button';
import { useEffect, useState } from 'react';
import type { SubjectList } from '@study-platform/contracts';
import { listSubjects } from './subjects-api.js';
export function SubjectSelect({
  value,
  onChange,
  label = 'Matéria (opcional)',
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SubjectList | null>(null);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setResult(null);
    setError(false);
    void listSubjects(page, 100)
      .then((result) => {
        if (active) setResult(result);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [page, revision]);
  return (
    <div className="subject-select">
      <Label>
        {label}
        <NativeSelect
          value={value}
          disabled={disabled || !result}
          onChange={(event) => onChange(event.target.value)}
        >
          <NativeSelectOption value="">Sem matéria</NativeSelectOption>
          {value && !result?.items.some((item) => item.id === value) && (
            <NativeSelectOption value={value}>
              Matéria selecionada
            </NativeSelectOption>
          )}
          {result?.items.map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>
              {item.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Label>
      {!result && !error && (
        <div>
          <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
          <p role="status">Carregando matérias…</p>
        </div>
      )}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            Não foi possível carregar matérias.{' '}
            <Button type="button" onClick={() => setRevision(revision + 1)}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {result && result.totalPages > 1 && (
        <div>
          <Button
            type="button"
            disabled={disabled || page === 1}
            onClick={() => setPage(page - 1)}
          >
            Matérias anteriores
          </Button>
          <Button
            type="button"
            disabled={disabled || page >= result.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Mais matérias
          </Button>
        </div>
      )}
    </div>
  );
}
