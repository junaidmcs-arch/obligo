import type { BackupData, BackupPreview } from '@/models/backup';
import {
  BACKUP_FORMAT,
  BACKUP_SCHEMA_VERSION,
  MAX_BACKUP_BYTES,
} from '@/models/backup';
import type {
  Category,
  Obligation,
  ObligationStatus,
  UserSettings,
} from '@/models/types';
import { validateObligation } from './obligationService';

function invalid(field: string): never {
  throw new Error(`Invalid backup: check ${field}.`);
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    invalid('record format');
  return value as Record<string, unknown>;
}
function string(value: unknown, field: string, max = 128): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    invalid(field);
  return value;
}
function integer(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  )
    invalid(field);
  return value;
}
function boolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') invalid(field);
  return value;
}
function choice<T extends string>(
  value: unknown,
  choices: readonly T[],
  field: string,
): T {
  if (typeof value !== 'string' || !choices.includes(value as T))
    invalid(field);
  return value as T;
}
function date(value: unknown, field: string): Date {
  const text = string(value, field, 24);
  const result = new Date(text);
  if (!Number.isFinite(result.getTime()) || result.toISOString() !== text)
    invalid(field);
  return result;
}
function list<T>(value: unknown, parse: (item: unknown) => T): T[] {
  if (!Array.isArray(value) || value.length > 100000) invalid('record list');
  return value.map(parse);
}
function category(value: unknown): Category {
  const item = record(value);
  const color = string(item.color, 'category color', 7);
  if (!/^#[0-9a-f]{6}$/i.test(color)) invalid('category color');
  return {
    id: string(item.id, 'category ID'),
    name: string(item.name, 'category name', 40).trim(),
    color,
  };
}
function obligation(value: unknown): Obligation {
  const item = record(value);
  const input = validateObligation({
    title: string(item.title, 'obligation title', 100),
    categoryId: string(item.categoryId, 'category reference'),
    dueDay: integer(item.dueDay, 'due day', 1, 31),
    priority: choice(item.priority, ['high', 'medium', 'low'], 'priority'),
    amount:
      item.amount === undefined
        ? undefined
        : typeof item.amount === 'number'
          ? item.amount
          : invalid('amount'),
    currency:
      item.currency === undefined
        ? undefined
        : string(item.currency, 'currency', 3),
  });
  return {
    ...input,
    id: string(item.id, 'obligation ID'),
    frequency: choice(item.frequency, ['monthly'], 'frequency'),
    isActive: boolean(item.isActive, 'archive state'),
    createdAt: date(item.createdAt, 'creation date'),
    updatedAt: date(item.updatedAt, 'updated date'),
    ...(item.startMonth === undefined
      ? {}
      : { startMonth: integer(item.startMonth, 'first month', 12, 119999) }),
  };
}
function status(value: unknown): ObligationStatus {
  const item = record(value);
  if (
    item.notes !== undefined &&
    (typeof item.notes !== 'string' || item.notes.length > 10000)
  )
    invalid('notes');
  return {
    id: string(item.id, 'status ID'),
    obligationId: string(item.obligationId, 'obligation reference'),
    year: integer(item.year, 'status year', 1, 9999),
    month: integer(item.month, 'status month', 1, 12),
    status: choice(
      item.status,
      ['pending', 'completed', 'overdue'],
      'completion status',
    ),
    ...(item.completedAt === undefined
      ? {}
      : { completedAt: date(item.completedAt, 'completion date') }),
    ...(item.notes === undefined ? {} : { notes: item.notes as string }),
  };
}
function settings(value: unknown): UserSettings {
  const item = record(value);
  return {
    id: choice(item.id, ['default'], 'settings ID'),
    theme: choice(item.theme, ['light', 'dark', 'system'], 'theme'),
    reminderDaysBefore: integer(
      item.reminderDaysBefore,
      'reminder days',
      0,
      365,
    ),
    notificationsEnabled: boolean(
      item.notificationsEnabled,
      'notification preference',
    ),
    currencySymbol: string(item.currencySymbol, 'currency symbol', 16),
  };
}
function unique(values: string[], field: string): Set<string> {
  const keys = new Set(values);
  if (keys.size !== values.length) invalid(`duplicate ${field}`);
  return keys;
}

export function parseBackup(text: string): {
  data: BackupData;
  preview: BackupPreview;
} {
  if (new Blob([text]).size > MAX_BACKUP_BYTES)
    throw new Error('Choose a backup smaller than 10 MB.');
  let json: unknown;
  try {
    json = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    throw new Error(
      'This file is not valid JSON. Choose an Obligo backup file.',
    );
  }
  const root = record(json);
  if (root.format !== BACKUP_FORMAT)
    throw new Error('This is not an Obligo backup file.');
  if (root.schemaVersion !== BACKUP_SCHEMA_VERSION)
    throw new Error(
      'Unsupported backup version. Update Obligo before restoring this file.',
    );
  const exportedAt = date(root.exportedAt, 'backup date');
  const appVersion = string(root.appVersion, 'app version', 40);
  const item = record(root.data);
  const data: BackupData = {
    categories: list(item.categories, category),
    obligations: list(item.obligations, obligation),
    statuses: list(item.statuses, status),
    settings: settings(item.settings),
  };
  const categories = unique(
    data.categories.map((c) => c.id),
    'category IDs',
  );
  unique(
    data.categories.map((c) => c.name.toLocaleLowerCase()),
    'category names',
  );
  const obligations = unique(
    data.obligations.map((o) => o.id),
    'obligation IDs',
  );
  unique(
    data.statuses.map((s) => s.id),
    'status IDs',
  );
  unique(
    data.statuses.map((s) => JSON.stringify([s.obligationId, s.year, s.month])),
    'monthly statuses',
  );
  if (data.obligations.some((o) => !categories.has(o.categoryId)))
    invalid('missing category reference');
  if (data.statuses.some((s) => !obligations.has(s.obligationId)))
    invalid('missing obligation reference');
  return {
    data,
    preview: {
      exportedAt,
      appVersion,
      categories: data.categories.length,
      obligations: data.obligations.length,
      archived: data.obligations.filter((o) => !o.isActive).length,
      statuses: data.statuses.length,
    },
  };
}
