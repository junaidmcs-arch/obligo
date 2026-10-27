import { useEffect, useState, type ReactNode } from 'react';
import {
  CircleCheck,
  FolderOpen,
  LayoutDashboard,
  ListTodo,
  Settings,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { NativeUpdateNotice } from '@/components/common/NativeUpdateNotice';
import { WebUpdateNotice } from '@/components/common/WebUpdateNotice';
export type Page = 'dashboard' | 'obligations' | 'categories' | 'settings';
const navigation = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'obligations', label: 'Obligations', icon: ListTodo },
  { id: 'categories', label: 'Categories', icon: FolderOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;
export function AppShell({
  page,
  onNavigate,
  children,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}) {
  const [online, setOnline] = useState(navigator.onLine);
  const native = Capacitor.isNativePlatform();
  const [ready, setReady] = useState(native);
  useEffect(() => {
    const change = () => setOnline(navigator.onLine);
    window.addEventListener('online', change);
    window.addEventListener('offline', change);
    return () => {
      window.removeEventListener('online', change);
      window.removeEventListener('offline', change);
    };
  }, []);
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#dashboard"
          onClick={() => onNavigate('dashboard')}
        >
          <span className="brand-icon">
            <CircleCheck size={27} />
          </span>
          <span>
            Obligo<small>SPACE FOR WHAT MATTERS</small>
          </span>
        </a>
        <p className="nav-caption">YOUR WORKSPACE</p>
        <nav aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <a
              href={`#${id}`}
              key={id}
              aria-current={page === id ? 'page' : undefined}
              onClick={() => onNavigate(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
              {page === id && <span className="nav-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <ShieldCheck size={22} />
          <strong>Yours. Always.</strong>
          <p>
            On your device.
            <br />
            Off your mind.
          </p>
          <span>POWERED BY ValidaCore.tech</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="breadcrumb">
            Workspace <span>/</span>{' '}
            <strong>{navigation.find((n) => n.id === page)?.label}</strong>
          </span>
          <span className="mobile-brand">Obligo</span>
          <span className="local-status">
            {online ? <span className="dot" /> : <WifiOff size={14} />}{' '}
            {online
              ? ready
                ? 'Ready offline'
                : 'Stored on this device'
              : 'Offline · local storage'}
          </span>
        </header>
        <div className="powered-by">
          <span>Powered by</span> <strong>ValidaCore.tech</strong>
        </div>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
      </div>
      {native ? (
        <NativeUpdateNotice />
      ) : (
        <WebUpdateNotice onReady={() => setReady(true)} />
      )}
    </div>
  );
}
