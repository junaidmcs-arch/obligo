import Dexie, { type Table } from 'dexie';
import type {
  Category,
  Obligation,
  ObligationStatus,
  UserSettings,
} from '@/models/types';
export class ObligoDatabase extends Dexie {
  categories!: Table<Category, string>;
  obligations!: Table<Obligation, string>;
  statuses!: Table<ObligationStatus, string>;
  settings!: Table<UserSettings, string>;
  constructor(name = 'ObligoDB') {
    super(name);
    // Boolean isActive cannot be an IndexedDB index; filter the small local collection.
    this.version(1).stores({
      categories: 'id,name',
      obligations: 'id,categoryId,dueDay,priority',
      statuses: 'id,obligationId,&[obligationId+year+month],status',
      settings: 'id',
    });
  }
}
export const db = new ObligoDatabase();
