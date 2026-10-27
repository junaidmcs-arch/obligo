import { db } from '@/db/db';
export const categoryService = {
  async save(name: string, color: string, id?: string) {
    name = name.trim();
    if (!name || name.length > 40)
      throw new Error('Enter a category name between 1 and 40 characters.');
    if (!/^#[0-9a-f]{6}$/i.test(color))
      throw new Error('Choose a valid color.');
    return db.transaction('rw', db.categories, async () => {
      if (id && !(await db.categories.get(id)))
        throw new Error('Category not found.');
      const duplicate = await db.categories
        .filter(
          (c) =>
            c.id !== id &&
            c.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
        )
        .first();
      if (duplicate)
        throw new Error('A category with this name already exists.');
      return db.categories.put({ id: id ?? crypto.randomUUID(), name, color });
    });
  },
  async remove(id: string) {
    return db.transaction('rw', db.categories, db.obligations, async () => {
      if (await db.obligations.where('categoryId').equals(id).count())
        throw new Error(
          'Move all obligations (including archived ones) to another category before deleting this category.',
        );
      await db.categories.delete(id);
    });
  },
};
