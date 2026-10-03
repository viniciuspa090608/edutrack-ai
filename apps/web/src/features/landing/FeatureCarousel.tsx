import { Card, CardContent } from '@study-platform/ui/components/ui/card';
import { Button } from '@study-platform/ui/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const slides = [
  {
    title: 'Tarefas em perspectiva',
    description:
      'Planeje o próximo passo e visualize o que merece sua atenção em cada dia.',
    image: '/illustrations/tasks.svg',
    alt: 'Ilustração de uma lista de estudos com tarefas concluídas e uma tarefa em destaque',
  },
  {
    title: 'Seu caminho de estudo',
    description:
      'Organize matérias e roadmaps para acompanhar a jornada do começo ao fim.',
    image: '/illustrations/roadmap.svg',
    alt: 'Ilustração de um roteiro de estudos com etapas conectadas',
  },
  {
    title: 'Foco no seu ritmo',
    description:
      'Intercale sessões Pomodoro e pausas para construir uma rotina sustentável.',
    image: '/illustrations/focus.svg',
    alt: 'Ilustração de um temporizador de foco e uma pausa planejada',
  },
  {
    title: 'Revisão que acompanha você',
    description:
      'Revise conceitos com flashcards e encontre pontos que merecem mais prática.',
    image: '/illustrations/flashcards.svg',
    alt: 'Ilustração de cartões de revisão sobrepostos',
  },
];

const INTERVAL_MS = 6000;

export function FeatureCarousel() {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    if (hovered || focused || hidden || reducedMotion) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [hovered, focused, hidden, reducedMotion]);

  const slide = slides[active]!;

  return (
    <Card asChild>
      <div
        className="feature-carousel"
        aria-label="Destaques da EduTrack"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setFocused(false);
        }}
      >
        <div className="carousel-art">
          <img src={slide.image} alt={slide.alt} />
        </div>
        <CardContent className="carousel-copy">
          <span className="carousel-count">
            Visão {String(active + 1).padStart(2, '0')} /{' '}
            {String(slides.length).padStart(2, '0')}
          </span>
          <h3>{slide.title}</h3>
          <p>{slide.description}</p>
          <div className="carousel-controls">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="carousel-arrow"
              aria-label="Slide anterior"
              onClick={() =>
                setActive(
                  (current) => (current - 1 + slides.length) % slides.length,
                )
              }
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </Button>
            <div className="carousel-dots" aria-label="Selecionar slide">
              {slides.map((item, index) => (
                <Button
                  type="button"
                  size="icon"
                  variant={index === active ? 'default' : 'outline'}
                  key={item.title}
                  className={
                    index === active ? 'carousel-dot is-active' : 'carousel-dot'
                  }
                  aria-label={`Mostrar slide ${index + 1}: ${item.title}`}
                  aria-current={index === active ? 'true' : undefined}
                  onClick={() => setActive(index)}
                />
              ))}
            </div>
            <Button
              type="button"
              className="carousel-arrow"
              aria-label="Próximo slide"
              onClick={() =>
                setActive((current) => (current + 1) % slides.length)
              }
            >
              <ArrowRight size={20} aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
