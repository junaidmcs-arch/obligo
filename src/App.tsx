import { useEffect, useState } from 'react';
import type { Obligation } from '@/models/types';
import { useObligo } from '@/hooks/useObligo';
import { useTheme } from '@/hooks/useTheme';
import { AppShell, type Page } from '@/components/layout/AppShell';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { CategoriesPage } from '@/features/categories/CategoriesPage';
import { ObligationsPage } from '@/features/obligations/ObligationsPage';
import { ObligationForm } from '@/features/obligations/ObligationForm';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
function currentPage(): Page {
  const page = location.hash.slice(1);
  return page === 'obligations' || page === 'categories' || page === 'settings'
    ? page
    : 'dashboard';
}
export default function App() {
  const data = useObligo();
  const [page, setPage] = useState<Page>(currentPage);
  const [editing, setEditing] = useState<Obligation | 'new' | null>(null);
  const [needsCategory, setNeedsCategory] = useState(false);
  useTheme(data?.settings.theme ?? 'system', data?.settings.colorTheme);
  useEffect(() => {
    const change = () => setPage(currentPage());
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  function navigate(next: Page) {
    location.hash = next;
    setPage(next);
  }
  function add() {
    if (!data?.categories.length) setNeedsCategory(true);
    else setEditing('new');
  }
  return (
    <AppShell page={page} onNavigate={navigate}>
      {!data ? (
        <div className="empty" role="status">
          Opening your workspace…
        </div>
      ) : (
        <>
          {page === 'dashboard' && (
            <DashboardPage
              {...data}
              onAdd={add}
              onEdit={setEditing}
              onView={() => navigate('obligations')}
            />
          )}{' '}
          {page === 'obligations' && (
            <ObligationsPage {...data} onAdd={add} onEdit={setEditing} />
          )}{' '}
          {page === 'categories' && <CategoriesPage {...data} />}{' '}
          {page === 'settings' && <SettingsPage settings={data.settings} />}{' '}
          {editing && (
            <ObligationForm
              categories={data.categories}
              obligation={editing === 'new' ? undefined : editing}
              onClose={() => setEditing(null)}
            />
          )}{' '}
          {needsCategory && (
            <Modal
              title="First, give it a category"
              onClose={() => setNeedsCategory(false)}
            >
              <p className="muted">
                Create a category to keep your obligations organized. Home,
                Education, or Subscriptions are good places to start.
              </p>
              <Button
                onClick={() => {
                  setNeedsCategory(false);
                  navigate('categories');
                }}
              >
                Go to categories
              </Button>
            </Modal>
          )}
        </>
      )}
    </AppShell>
  );
}
