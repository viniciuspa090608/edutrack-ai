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
      <label>
        {label}
        <select
          value={value}
          disabled={disabled || !result}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Sem matéria</option>
          {value && !result?.items.some((item) => item.id === value) && (
            <option value={value}>Matéria selecionada</option>
          )}
          {result?.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      {!result && !error && <p role="status">Carregando matérias…</p>}
      {error && (
        <p role="alert">
          Não foi possível carregar matérias.{' '}
          <button type="button" onClick={() => setRevision(revision + 1)}>
            Tentar novamente
          </button>
        </p>
      )}
      {result && result.totalPages > 1 && (
        <div>
          <button
            type="button"
            disabled={disabled || page === 1}
            onClick={() => setPage(page - 1)}
          >
            Matérias anteriores
          </button>
          <button
            type="button"
            disabled={disabled || page >= result.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Mais matérias
          </button>
        </div>
      )}
    </div>
  );
}
