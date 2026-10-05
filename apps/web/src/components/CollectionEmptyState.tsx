import type { ReactNode } from 'react';
import { useId } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@study-platform/ui/components/ui/button';
import '../styles/collection-empty-state.css';

export function CollectionEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const titleId = useId();
  return (
    <section className="collection-empty-state" aria-labelledby={titleId}>
      <div className="collection-empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <h2 id={titleId}>{title}</h2>
      <p>{description}</p>
      <Button type="button" onClick={onAction}>
        <Plus aria-hidden="true" />
        {actionLabel}
      </Button>
    </section>
  );
}
