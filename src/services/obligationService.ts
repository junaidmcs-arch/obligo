import { db } from '@/db/db';
import type { ObligationInput } from '@/models/types';
export function validateObligation(input: ObligationInput): ObligationInput {
  const title = input.title.trim();
  if (!title || title.length > 100)
    throw new Error('Enter a title between 1 and 100 characters.');
  if (!input.categoryId) throw new Error('Choose a category.');
  if (!Number.isInteger(input.dueDay) || input.dueDay < 1 || input.dueDay > 31)
    throw new Error('Due day must be a whole number from 1 to 31.');
  if (!['high', 'medium', 'low'].includes(input.priority))
    throw new Error('Choose a valid priority.');
  if (
    input.amount !== undefined &&
    (!Number.isFinite(input.amount) ||
      input.amount < 0 ||
      input.amount > 999999999)
  )
    throw new Error('Enter an amount between 0 and 999,999,999.');
  const currency = input.currency?.trim().toUpperCase();
  if (input.amount !== undefined && (!currency || !/^[A-Z]{3}$/.test(currency)))
    throw new Error('Enter a three-letter currency code, such as PKR or USD.');
  return {
    ...input,
    title,
    currency: input.amount === undefined ? undefined : currency,
  };
}
export const obligationService = {
  async save(input: ObligationInput, id?: string) {
    const value = validateObligation(input);
    return db.transaction('rw', db.obligations, db.categories, async () => {
      if (!(await db.categories.get(value.categoryId)))
        throw new Error('This category no longer exists. Choose another.');
      const existing = id ? await db.obligations.get(id) : undefined;
      if (id && !existing) throw new Error('This obligation no longer exists.');
      const now = new Date();
      return db.obligations.put({
        ...value,
        id: existing?.id ?? crypto.randomUUID(),
        frequency: 'monthly',
        isActive: existing?.isActive ?? true,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });
    });
  },
  async setActive(id: string, isActive: boolean) {
    if (!(await db.obligations.update(id, { isActive, updatedAt: new Date() })))
      throw new Error('Obligation not found.');
  },
};
