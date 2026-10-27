import { useState, type SubmitEvent } from 'react';
import type { Category, Obligation, Priority } from '@/models/types';
import { obligationService } from '@/services/obligationService';
import { errorMessage } from '@/lib/utils';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
export function ObligationForm({
  categories,
  obligation,
  onClose,
}: {
  categories: Category[];
  obligation?: Obligation;
  onClose: () => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await obligationService.save(
        {
          title: String(data.get('title')),
          categoryId: String(data.get('category')),
          dueDay: Number(data.get('dueDay')),
          priority: String(data.get('priority')) as Priority,
          amount:
            data.get('amount') === '' ? undefined : Number(data.get('amount')),
          currency: String(data.get('currency')),
        },
        obligation?.id,
      );
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={obligation ? 'Edit obligation' : 'A little less to remember'}
      onClose={onClose}
    >
      <p className="muted">Set it up once. Keep it in sight every month.</p>
      <form onSubmit={submit} className="form-stack">
        <label>
          Title
          <input
            name="title"
            autoFocus
            required
            maxLength={100}
            placeholder="e.g. Home internet"
            defaultValue={obligation?.title}
          />
        </label>
        <label>
          Category
          <select
            name="category"
            required
            defaultValue={obligation?.categoryId ?? ''}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <label>
            Due day
            <input
              name="dueDay"
              type="number"
              required
              min={1}
              max={31}
              step={1}
              defaultValue={obligation?.dueDay}
              placeholder="1–31"
            />
          </label>
          <label>
            Priority
            <select
              name="priority"
              required
              defaultValue={obligation?.priority ?? 'medium'}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        </div>
        <p className="field-note">
          Repeats monthly. Past due days start next month. Shorter months use
          the last day.
        </p>
        <div className="form-grid">
          <label>
            Amount <span className="muted">(optional)</span>
            <input
              name="amount"
              type="number"
              min={0}
              max={999999999}
              step="0.01"
              defaultValue={obligation?.amount}
              placeholder="0.00"
            />
          </label>
          <label>
            Currency
            <input
              name="currency"
              maxLength={3}
              pattern="[A-Za-z]{3}"
              defaultValue={obligation?.currency ?? 'PKR'}
              placeholder="PKR"
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy}>
            {busy ? 'Saving…' : 'Save obligation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
