import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@study-platform/ui/components/ui/select';
import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import { Label } from '@study-platform/ui/components/ui/label';
import { Button } from '@study-platform/ui/components/ui/button';
import { useEffect, useState } from 'react';
import type { SubjectList } from '@study-platform/contracts';
import { listSubjects } from './subjects-api.js';
import '../../styles/subject-associations.css';
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
        <Select
          value={value || '__edutrack_empty__'}
          disabled={disabled || !result}
          onValueChange={(selected) =>
            onChange(selected === '__edutrack_empty__' ? '' : selected)
          }
        >
          <SelectTrigger className="w-full min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="__edutrack_empty__">Sem matéria</SelectItem>
            {value && !result?.items.some((item) => item.id === value) && (
              <SelectItem value={value}>Matéria selecionada</SelectItem>
            )}
            {result?.items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            <Button
              variant="outline"
              type="button"
              onClick={() => setRevision(revision + 1)}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {result && result.totalPages > 1 && (
        <div>
          <Button
            variant="outline"
            type="button"
            disabled={disabled || page === 1}
            onClick={() => setPage(page - 1)}
          >
            Matérias anteriores
          </Button>
          <Button
            variant="outline"
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
