import { format } from 'date-fns';
import type { Category, Obligation, ObligationStatus } from '@/models/types';
import { CompletionControl } from '@/features/obligations/CompletionControl';
export function AttentionList({
  items,
  categories,
  statuses,
  onEdit,
}: {
  items: { obligation: Obligation; date: Date; days: number }[];
  categories: Category[];
  statuses: ObligationStatus[];
  onEdit: (o: Obligation) => void;
}) {
  return (
    <div className="attention-list">
      {items.map(({ obligation: o, date, days }) => (
        <div key={o.id} className="attention-item">
          <button className="attention-row" onClick={() => onEdit(o)}>
            <span className="date-tile">
              <small>{format(date, 'MMM')}</small>
              <strong>{format(date, 'dd')}</strong>
            </span>
            <span className="attention-name">
              <strong>{o.title}</strong>
              <small>
                <span
                  className="dot"
                  style={{
                    background: categories.find((c) => c.id === o.categoryId)
                      ?.color,
                  }}
                />
                {categories.find((c) => c.id === o.categoryId)?.name}
              </small>
            </span>
            <span
              className={`badge ${days < 0 ? 'overdue' : days === 0 ? 'today' : ''}`}
            >
              {days < 0
                ? `${-days}d overdue`
                : days === 0
                  ? 'Due today'
                  : `In ${days}d`}
            </span>
          </button>
          <CompletionControl obligation={o} date={date} statuses={statuses} />
        </div>
      ))}
    </div>
  );
}
