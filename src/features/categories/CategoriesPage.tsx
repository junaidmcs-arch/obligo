import { useState, type SubmitEvent } from 'react';
import { FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Category, Obligation } from '@/models/types';
import { categoryService } from '@/services/categoryService';
import { errorMessage } from '@/lib/utils';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
export function CategoriesPage({
  categories,
  obligations,
}: {
  categories: Category[];
  obligations: Obligation[];
}) {
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const current = editing && editing !== 'new' ? editing : undefined;
  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await categoryService.save(
        String(data.get('name')),
        String(data.get('color')),
        current?.id,
      );
      setEditing(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError('');
    try {
      await categoryService.remove(deleting.id);
      setDeleting(null);
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
          <p className="eyebrow">A PLACE FOR EVERYTHING</p>
          <h1>Categories</h1>
          <p className="muted">Make your responsibilities easier to find.</p>
        </div>
        <Button
          onClick={() => {
            setError('');
            setEditing('new');
          }}
        >
          <Plus size={18} /> Add category
        </Button>
      </div>
      {!categories.length && (
        <div className="empty panel">
          <FolderOpen size={36} />
          <h2>Start with a little organization</h2>
          <p className="muted">
            Create a category like Home, Education, or Subscriptions.
          </p>
          <Button onClick={() => setEditing('new')}>
            Create your first category
          </Button>
        </div>
      )}
      <div className="category-grid">
        {categories.map((c) => (
          <article className="panel category-card" key={c.id}>
            <span className="category-icon" style={{ color: c.color }}>
              <FolderOpen size={24} />
            </span>
            <h2>{c.name}</h2>
            <p className="muted">
              {obligations.filter((o) => o.categoryId === c.id).length}{' '}
              obligations
            </p>
            <div className="row-actions">
              <Button
                variant="ghost"
                aria-label={`Edit ${c.name}`}
                onClick={() => {
                  setError('');
                  setEditing(c);
                }}
              >
                <Pencil size={16} /> Edit
              </Button>
              <Button
                variant="ghost"
                aria-label={`Delete ${c.name}`}
                onClick={() => {
                  setError('');
                  setDeleting(c);
                }}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </article>
        ))}
      </div>
      {editing && (
        <Modal
          title={current ? 'Edit category' : 'Create category'}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save} className="form-stack">
            <label>
              Name
              <input
                autoFocus
                name="name"
                required
                maxLength={40}
                defaultValue={current?.name}
                placeholder="e.g. Home & utilities"
              />
            </label>
            <label>
              Category color
              <input
                name="color"
                type="color"
                defaultValue={current?.color ?? '#176b50'}
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <Button disabled={busy}>
              {busy ? 'Saving…' : 'Save category'}
            </Button>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal
          title={`Delete ${deleting.name}?`}
          onClose={() => setDeleting(null)}
        >
          <p className="muted">
            Only empty categories can be deleted. Obligations are always
            preserved.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="form-actions">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy ? 'Deleting…' : 'Delete category'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
