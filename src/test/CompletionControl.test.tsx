import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CompletionControl } from '@/features/obligations/CompletionControl';
import { statusService } from '@/services/statusService';
import type { Obligation } from '@/models/types';
const date = new Date(2026, 10, 10);
const obligation: Obligation = {
  id: 'test',
  title: 'Internet',
  categoryId: 'home',
  dueDay: 10,
  priority: 'high',
  frequency: 'monthly',
  isActive: true,
  createdAt: date,
  updatedAt: date,
};
afterEach(() => vi.restoreAllMocks());
it('labels the completion month, persists the action, and allows undo', async () => {
  const save = vi.spyOn(statusService, 'setCompleted').mockResolvedValue();
  const view = render(
    <CompletionControl obligation={obligation} date={date} statuses={[]} />,
  );
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Mark completed for Internet, November 2026',
    }),
  );
  await waitFor(() => expect(save).toHaveBeenCalledWith('test', date, true));
  view.rerender(
    <CompletionControl
      obligation={obligation}
      date={date}
      statuses={[
        {
          id: 's',
          obligationId: 'test',
          year: 2026,
          month: 11,
          status: 'completed',
        },
      ]}
    />,
  );
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Undo completion for Internet, November 2026',
    }),
  );
  await waitFor(() => expect(save).toHaveBeenCalledWith('test', date, false));
});
