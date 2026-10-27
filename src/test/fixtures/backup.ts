import { defaultSettings } from '@/services/settingsService';

export function backupFixture() {
  return {
    format: 'obligo-backup',
    schemaVersion: 1,
    appVersion: '0.1.2',
    exportedAt: '2026-10-27T12:00:00.000Z',
    data: {
      categories: [{ id: 'home', name: 'Home 🏠', color: '#176b50' }],
      obligations: [
        {
          id: 'internet',
          title: 'انٹرنیٹ',
          categoryId: 'home',
          dueDay: 10,
          priority: 'high',
          frequency: 'monthly',
          isActive: false,
          amount: 3000.5,
          currency: 'PKR',
          startMonth: 24322,
          createdAt: '2026-10-27T10:00:00.000Z',
          updatedAt: '2026-10-27T11:00:00.000Z',
        },
      ],
      statuses: [
        {
          id: 'paid',
          obligationId: 'internet',
          year: 2026,
          month: 11,
          status: 'completed',
          completedAt: '2026-10-27T11:00:00.000Z',
          notes: 'Paid ✓',
        },
      ],
      settings: { ...defaultSettings, theme: 'dark' as const },
    },
  };
}
