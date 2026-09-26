import { useEffect, useState } from 'react';
import { subjectDetail } from './subjects-api.js';
export function SubjectName({ id }: { id: string | null }) {
  const [name, setName] = useState('');
  useEffect(() => {
    let active = true;
    setName('');
    if (id)
      void subjectDetail(id)
        .then((subject) => {
          if (active) setName(subject.name);
        })
        .catch(() => {
          if (active) setName('Matéria indisponível');
        });
    return () => {
      active = false;
    };
  }, [id]);
  return <span>{id ? name || 'Carregando matéria…' : 'Sem matéria'}</span>;
}
