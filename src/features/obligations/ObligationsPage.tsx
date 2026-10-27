import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { Category, Obligation } from '@/models/types';
import { obligationService } from '@/services/obligationService';
import { errorMessage } from '@/lib/utils';
import { ObligationCard } from './ObligationCard';
import { Button } from '@/components/ui/button';
export function ObligationsPage({
  obligations,
  categories,
  onAdd,
  onEdit,
}: {
  obligations: Obligation[];
  categories: Category[];
  onAdd: () => void;
  onEdit: (o: Obligation) => void;
}) {
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const visible = obligations
    .filter(
      (o) =>
        (filter === 'all' || o.isActive === (filter === 'active')) &&
        o.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    )
    .sort((a, b) => a.dueDay - b.dueDay || a.title.localeCompare(b.title));
  async function archive(o: Obligation) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await obligationService.setActive(o.id, !o.isActive);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">YOUR EVERYDAY RESPONSIBILITIES</p>
          <h1>Obligations</h1>
          <p className="muted">
            One place for the things you don’t want to forget.
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus size={18} /> Add obligation
        </Button>
      </div>
      <div className="toolbar">
        <div className="tabs" aria-label="Filter obligations">
          {['active', 'archived', 'all'].map((f) => (
            <button
              key={f}
              aria-pressed={f === filter}
              className={filter === f ? 'selected' : ''}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Search obligations"
            placeholder="Search obligations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="obligation-grid" aria-busy={busy}>
        {visible.map((o) => (
          <ObligationCard
            key={o.id}
            obligation={o}
            category={categories.find((c) => c.id === o.categoryId)}
            onEdit={() => onEdit(o)}
            onArchive={() => void archive(o)}
          />
        ))}
      </div>
      {!visible.length && (
        <div className="panel empty">
          <h2>
            {search ? 'No matching obligations' : 'A little breathing room'}
          </h2>
          <p className="muted">
            {search
              ? 'Try another title or filter.'
              : 'Your obligations will appear here when you add them.'}
          </p>
          <Button onClick={onAdd}>Add an obligation</Button>
        </div>
      )}
    </>
  );
}
