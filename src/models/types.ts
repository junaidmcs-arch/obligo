export type Priority = 'high' | 'medium' | 'low';
export type Status = 'pending' | 'completed' | 'overdue';
export interface Category {
  id: string;
  name: string;
  color: string;
}
export interface Obligation {
  id: string;
  title: string;
  categoryId: string;
  dueDay: number;
  amount?: number;
  currency?: string;
  priority: Priority;
  frequency: 'monthly';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type ObligationInput = Pick<
  Obligation,
  'title' | 'categoryId' | 'dueDay' | 'amount' | 'currency' | 'priority'
>;
export interface ObligationStatus {
  id: string;
  obligationId: string;
  year: number;
  month: number;
  status: Status;
  completedAt?: Date;
  notes?: string;
}
export interface UserSettings {
  id: 'default';
  theme: 'light' | 'dark' | 'system';
  reminderDaysBefore: number;
  notificationsEnabled: boolean;
  currencySymbol: string;
}
