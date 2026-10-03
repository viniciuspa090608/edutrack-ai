import {
  CardHeader,
  Card,
  CardContent,
} from '@study-platform/ui/components/ui/card';

import { Button } from '@study-platform/ui/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import type { Flashcard } from '@study-platform/contracts';
export function CardViewer({
  card,
  onClose,
}: {
  card: Flashcard;
  onClose: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <Card asChild>
      <section className="flashcard-panel" aria-label="Consulta do cartão">
        <CardHeader>
          <h3 tabIndex={-1} ref={heading}>
            Frente
          </h3>
        </CardHeader>
        <CardContent>
          <p className="flashcard-text">{card.front}</p>
          <div aria-live="polite">
            {revealed && (
              <>
                <h4>Resposta</h4>
                <p className="flashcard-text">{card.back}</p>
              </>
            )}
          </div>
          <div className="flashcard-actions">
            <Button
              type="button"
              aria-expanded={revealed}
              onClick={() => setRevealed(!revealed)}
            >
              {revealed ? 'Mostrar frente' : 'Revelar resposta'}
            </Button>
            <Button type="button" onClick={onClose}>
              Fechar cartão
            </Button>
          </div>
        </CardContent>
      </section>
    </Card>
  );
}
