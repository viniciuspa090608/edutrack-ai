import { Badge } from '@study-platform/ui/components/ui/badge';
import { useEffect, useState } from 'react';
import { subjectDetail } from './subjects-api.js';
import '../../styles/subject-associations.css';
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
  return (
    <Badge className="subject-name" variant="secondary">
      {id ? name || 'Carregando matéria…' : 'Sem matéria'}
    </Badge>
  );
}
