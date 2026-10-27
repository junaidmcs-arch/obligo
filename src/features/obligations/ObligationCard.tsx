import { Archive, CalendarDays, Pencil, RotateCcw } from 'lucide-react';
import type { Category, Obligation } from '@/models/types';
import { Button } from '@/components/ui/button';
export function ObligationCard({
  obligation: o,
  category,
  onEdit,
  onArchive,
}: {
  obligation: Obligation;
  category?: Category;
  onEdit: () => void;
  onArchive: () => void;
}) {
  return (
    <article className="panel obligation-card">
      <div className="card-top">
        <span className={`badge priority-${o.priority}`}>
          {o.priority} priority
        </span>
        {!o.isActive && <span className="badge">Archived</span>}
      </div>
      <h2>{o.title}</h2>
      <p className="category-label">
        <span className="dot" style={{ backgroundColor: category?.color }} />
        {category?.name ?? 'Uncategorized'}
      </p>
      <div className="obligation-meta">
        <span>
          <CalendarDays size={16} /> Day {o.dueDay} · Monthly
        </span>
        {o.amount !== undefined && (
          <strong>
            {o.currency}{' '}
            {o.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </strong>
        )}
      </div>
      <div className="card-footer">
        <Button variant="ghost" onClick={onEdit}>
          <Pencil size={15} /> Edit
        </Button>
        <Button variant="ghost" onClick={onArchive}>
          {o.isActive ? <Archive size={15} /> : <RotateCcw size={15} />}{' '}
          {o.isActive ? 'Archive' : 'Restore'}
        </Button>
      </div>
    </article>
  );
}
