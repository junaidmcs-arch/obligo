import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, expect, it, vi } from 'vitest';
import { ObligationForm } from '@/features/obligations/ObligationForm';
import { obligationService } from '@/services/obligationService';
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = vi.fn();
});
it('keeps entered values and explains a failed save', async () => {
  vi.spyOn(obligationService, 'save').mockRejectedValueOnce(
    new Error('Storage is full.'),
  );
  const onClose = vi.fn();
  render(
    <ObligationForm
      categories={[{ id: 'home', name: 'Home', color: '#176b50' }]}
      onClose={onClose}
    />,
  );
  fireEvent.change(screen.getByLabelText('Title'), {
    target: { value: 'Internet' },
  });
  fireEvent.change(screen.getByLabelText('Category'), {
    target: { value: 'home' },
  });
  fireEvent.change(screen.getByLabelText('Due day'), {
    target: { value: '12' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save obligation' }));
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('Storage is full.'),
  );
  expect(screen.getByLabelText('Title')).toHaveValue('Internet');
  expect(onClose).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});
