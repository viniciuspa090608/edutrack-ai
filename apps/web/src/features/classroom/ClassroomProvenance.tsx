import { useState } from 'react';
import {
  classroomSourceSchema,
  classroomCourseSchema,
} from '@study-platform/contracts';
import { Button } from '@study-platform/ui/components/ui/button';
import {
  classroomRequest as request,
  classroomError,
} from './classroom-api.js';

export function ClassroomProvenance({
  id,
  module,
}: {
  id: string;
  module: 'tasks' | 'subjects';
}) {
  const [data, setData] = useState<
      Array<{
        title: string;
        link: string | null;
        deadline: string | null;
        attachments: Array<{ title: string; link: string }>;
      }>
    >([]),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <section>
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError('');
          void request(`/${module}/${id}/classroom-source`)
            .then((value) => {
              const rows = Array.isArray(value) ? value : value ? [value] : [];
              const result = rows.map((row) => {
                if (module === 'tasks') {
                  const parsed = classroomSourceSchema.parse(row.source);
                  return {
                    title: parsed.courseName,
                    link: parsed.link,
                    deadline: parsed.dueAt
                      ? `${new Date(parsed.dueAt).toLocaleString('pt-BR', { timeZone: parsed.timeZone })} (${parsed.timeZone})`
                      : parsed.originalDueDate,
                    attachments: parsed.attachments,
                  };
                }
                const parsed = classroomCourseSchema.parse(row.source.course);
                return {
                  title: parsed.name,
                  link: parsed.link,
                  deadline: null,
                  attachments: [],
                };
              });
              setData(result);
              setMessage(
                result.length
                  ? 'Origem da importação'
                  : 'Este registro não tem origem Google Classroom.',
              );
            })
            .catch((cause) => setError(classroomError(cause)))
            .finally(() => setBusy(false));
        }}
      >
        Consultar origem Google Classroom
      </Button>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
      {data.map((item, index) => (
        <div key={index}>
          <p>{item.title}</p>
          {item.link && (
            <a href={item.link} target="_blank" rel="noreferrer">
              Abrir origem no Classroom
            </a>
          )}
          {item.deadline && <p>Prazo original: {item.deadline}</p>}
          <ul>
            {item.attachments.map((file) => (
              <li key={file.link}>
                <a href={file.link} target="_blank" rel="noreferrer">
                  {file.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
