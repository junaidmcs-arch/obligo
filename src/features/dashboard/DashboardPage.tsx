import {
  ArrowRight,
  CalendarDays,
  CircleCheck,
  Flag,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Category, Obligation } from '@/models/types';
import { dashboardSummary } from '@/services/dashboardService';
import { useToday } from '@/hooks/useObligo';
import { Button } from '@/components/ui/button';
export function DashboardPage({
  obligations,
  categories,
  onAdd,
  onEdit,
  onView,
}: {
  obligations: Obligation[];
  categories: Category[];
  onAdd: () => void;
  onEdit: (o: Obligation) => void;
  onView: () => void;
}) {
  const today = useToday();
  const summary = dashboardSummary(obligations, today);
  const stats = [
    {
      label: 'Total obligations',
      value: summary.total,
      icon: Layers,
      note: 'Everything in one place',
      color: 'green',
    },
    {
      label: 'Active',
      value: summary.active,
      icon: CircleCheck,
      note: 'Recurring every month',
      color: 'blue',
    },
    {
      label: 'High priority',
      value: summary.high,
      icon: Flag,
      note: 'A little extra attention',
      color: 'orange',
    },
    {
      label: 'Due this week',
      value: summary.thisWeek,
      icon: CalendarDays,
      note: 'Today and the next 6 days',
      color: 'purple',
    },
  ];
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">
            {format(today, 'EEEE, MMMM d, yyyy').toUpperCase()}
          </p>
          <h1>What needs my attention today?</h1>
          <p className="muted">Less on your mind. More room for your day.</p>
        </div>
        <Button onClick={onAdd}>
          <Plus size={18} /> Add obligation
        </Button>
      </div>
      <div className="stats-grid">
        {stats.map((s) => (
          <article className="panel stat" key={s.label}>
            <div className="stat-label">
              {s.label}
              <span className={`stat-icon ${s.color}`}>
                <s.icon size={19} />
              </span>
            </div>
            <strong>{s.value}</strong>
            <p>{s.note}</p>
          </article>
        ))}
      </div>
      {!summary.total && (
        <section className="welcome">
          <div className="welcome-art">
            <CircleCheck size={44} />
            <span className="sparkle">
              <Sparkles size={20} />
            </span>
          </div>
          <div>
            <p className="eyebrow">A CALMER WAY TO STAY ON TOP OF THINGS</p>
            <h2>Big peace of mind. Small first step.</h2>
            <p>
              From your internet bill to school fees, give every obligation a
              home.
              <br className="desktop-break" /> We’ll keep the dates in view, so
              you don’t have to.
            </p>
            <Button onClick={onAdd}>
              <Plus size={17} /> Add your first obligation
            </Button>
          </div>
        </section>
      )}
      <div className="dashboard-grid">
        <section className="panel action-panel">
          <div className="section-heading">
            <div>
              <h2>Your attention, here</h2>
              <p className="muted">This month’s obligations, in date order.</p>
            </div>
            <span className="badge">{summary.active} active</span>
          </div>
          {summary.action.length ? (
            <>
              <p className="scope-note">
                Date-based overview · Completion tracking is not available yet.
              </p>
              <div className="attention-list">
                {summary.action.map(({ obligation: o, days, date }) => (
                  <button
                    className="attention-row"
                    key={o.id}
                    onClick={() => onEdit(o)}
                  >
                    <span className="date-tile">
                      <small>{format(date, 'MMM')}</small>
                      <strong>{format(date, 'dd')}</strong>
                    </span>
                    <span className="attention-name">
                      <strong>{o.title}</strong>
                      <small>
                        <span
                          className="dot"
                          style={{
                            background: categories.find(
                              (c) => c.id === o.categoryId,
                            )?.color,
                          }}
                        />
                        {categories.find((c) => c.id === o.categoryId)?.name}
                      </small>
                    </span>
                    <span
                      className={`badge ${days < 0 ? 'overdue' : days === 0 ? 'today' : ''}`}
                    >
                      {days < 0
                        ? `${-days}d overdue`
                        : days === 0
                          ? 'Due today'
                          : `In ${days}d`}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="empty compact">
              <span className="empty-icon">
                <CircleCheck size={27} />
              </span>
              <h3>A fresh start</h3>
              <p className="muted">
                Your active obligations will show up here,
                <br /> with the nearest dates first.
              </p>
            </div>
          )}
          <button className="section-link" onClick={onView}>
            View all obligations <ArrowRight size={16} />
          </button>
        </section>
        <section className="panel upcoming-panel">
          <div className="section-heading">
            <div>
              <h2>Coming up next</h2>
              <p className="muted">Your next 5 recurring dates.</p>
            </div>
            <CalendarDays size={20} />
          </div>
          {summary.upcoming.length ? (
            summary.upcoming.map(({ obligation: o, date }) => (
              <button
                key={o.id}
                className="upcoming-row"
                onClick={() => onEdit(o)}
              >
                <span
                  className="dot"
                  style={{
                    background: categories.find((c) => c.id === o.categoryId)
                      ?.color,
                  }}
                />
                <span>
                  <strong>{o.title}</strong>
                  <small>{format(date, 'MMM d, yyyy')}</small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))
          ) : (
            <div className="empty compact">
              <CalendarDays size={29} />
              <h3>A clear horizon</h3>
              <p className="muted">
                Add an obligation to see
                <br /> what’s ahead.
              </p>
            </div>
          )}
        </section>
      </div>
      <div className="privacy-note">
        <ShieldCheck size={16} />
        <span>
          Just you and your device. Your obligations stay private, even offline.
        </span>
        <span className="byline">
          Thoughtfully made by <strong>Validacore</strong>
        </span>
      </div>
    </>
  );
}
