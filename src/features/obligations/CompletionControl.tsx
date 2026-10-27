import { useState } from 'react';
import { CircleCheck, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import type { Obligation, ObligationStatus } from '@/models/types';
import { isCompleted } from '@/services/scheduleService';
import { statusService } from '@/services/statusService';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/utils';
export function CompletionControl({
  obligation,
  date,
  statuses,
}: {
  obligation: Obligation;
  date: Date;
  statuses: ObligationStatus[];
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const completed = isCompleted(obligation.id, date, statuses);
  async function toggle() {
    setBusy(true);
    setError('');
    try {
      await statusService.setCompleted(obligation.id, date, !completed);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="completion-control">
      {completed && (
        <span className="completion-label">
          <CircleCheck size={16} /> Completed · {format(date, 'MMM yyyy')}
        </span>
      )}
      <Button
        variant={completed ? 'outline' : 'default'}
        disabled={busy}
        onClick={() => void toggle()}
        aria-label={`${completed ? 'Undo completion' : 'Mark completed'} for ${obligation.title}, ${format(date, 'MMMM yyyy')}`}
      >
        {completed ? <RotateCcw size={15} /> : <CircleCheck size={15} />}
        {busy
          ? 'Saving…'
          : completed
            ? 'Undo completion'
            : `Complete · ${format(date, 'MMM yyyy')}`}
      </Button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
