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
    <section className="flashcard-panel" aria-label="Consulta do cartão">
      <h3 tabIndex={-1} ref={heading}>
        Frente
      </h3>
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
        <button
          type="button"
          aria-expanded={revealed}
          onClick={() => setRevealed(!revealed)}
        >
          {revealed ? 'Mostrar frente' : 'Revelar resposta'}
        </button>
        <button type="button" onClick={onClose}>
          Fechar cartão
        </button>
      </div>
    </section>
  );
}
