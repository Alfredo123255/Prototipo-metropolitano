import { useCallback, useEffect, useState } from 'react';
import { Check, CircleCheck, Clock3, RotateCcw, ShieldCheck, Sparkles, X } from 'lucide-react';
import { es } from '../i18n/es';
import type { Recommendation } from '../data/types';
import { routeGap } from '../sim/engine';
import { useSimulation } from '../state/useSimulation';
import { Dialog } from './ui';

export function Recommendations() {
  const { state, dispatch, notify } = useSimulation();
  const [confirmation, setConfirmation] = useState<Recommendation | null>(null);
  const [expanded, setExpanded] = useState(false);
  const pending = state.recommendations.filter((r) => r.status === 'suggested');
  const active = state.recommendations.filter((r) => r.status === 'accepted');
  const act = useCallback(
    (type: 'accept' | 'dismiss' | 'postpone', recommendation: Recommendation, force = false) => {
      if (type === 'accept') {
        const available = state.dynamic.buses.filter(
          (bus) => bus.route === recommendation.from && bus.state === 'service',
        ).length;
        if (state.mode === 'fixed' || available < recommendation.count) return;
        if (!force && routeGap(state.dynamic, recommendation.from, recommendation.count) > 6) {
          setConfirmation(recommendation);
          return;
        }
      }
      dispatch({ type, id: recommendation.id, force });
      notify(
        es.toast[type === 'accept' ? 'accepted' : type === 'dismiss' ? 'dismissed' : 'postponed'],
        type === 'accept' ? recommendation.id : undefined,
      );
    },
    [state.dynamic, state.mode, dispatch, notify],
  );
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest(
          'input,select,textarea,button,a,[role="button"],[contenteditable="true"],dialog',
        ) ||
        document.querySelector('dialog[open]') ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      if (event.code === 'Space') {
        event.preventDefault();
        dispatch({ type: 'pause' });
      }
      if (pending[0] && event.key.toLowerCase() === 'a') act('accept', pending[0]);
      if (pending[0] && event.key.toLowerCase() === 'd') act('dismiss', pending[0]);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [pending, act, dispatch]);
  return (
    <aside className="card recommendations">
      <header className="card-header">
        <div>
          <h2>
            <Sparkles size={16} />
            {es.actions}
            <span className="count-badge">{pending.length}</span>
          </h2>
          <p>{es.actionsSub}</p>
        </div>
      </header>
      <div className="recommendation-list">
        {state.mode === 'fixed' && <p className="fixed-notice">{es.fixedNotice}</p>}
        {pending.slice(0, expanded ? pending.length : 2).map((r, i) => {
          const station = state.dynamic.stations[r.station];
          const gap = routeGap(state.dynamic, r.from, r.count);
          const unavailable =
            state.dynamic.buses.filter((bus) => bus.route === r.from && bus.state === 'service')
              .length < r.count;
          return (
            <article className="recommendation" key={r.id}>
              <div className="recommendation-meta">
                <span className={i === 0 ? 'priority-label' : 'prevent-label'}>
                  {i === 0 ? es.priority : es.prevent}
                </span>
                <span>
                  <Clock3 size={11} />
                  {r.eta} {es.minute}
                </span>
              </div>
              <h3>{es.moveTitle(r.count, r.from, station.name)}</h3>
              <p>{es.reason(station.queue, station.forecast[2])}</p>
              <div className={`coverage ${gap > 6 ? 'risk' : ''}`}>
                <ShieldCheck size={13} />
                {gap > 6 ? es.coverageRisk(r.from, gap) : es.coverage(r.from, gap)}
              </div>
              <div className="recommendation-buttons">
                <button
                  className={`button ${i === 0 ? 'green' : 'secondary'}`}
                  onClick={() => act('accept', r)}
                  disabled={state.mode === 'fixed' || unavailable}
                  title={
                    state.mode === 'fixed' ? es.disabledMode : unavailable ? es.noBuses : es.accept
                  }
                >
                  <Check size={14} />
                  {es.accept}
                </button>
                <button
                  className="icon-button"
                  aria-label={`${es.postpone}: ${station.name}`}
                  title={es.postpone}
                  onClick={() => act('postpone', r)}
                >
                  <Clock3 size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`${es.dismiss}: ${station.name}`}
                  title={es.dismiss}
                  onClick={() => act('dismiss', r)}
                >
                  <X size={16} />
                </button>
              </div>
              {unavailable && <p className="caption">{es.noBuses}</p>}
            </article>
          );
        })}
        {pending.length > 2 && (
          <button
            className="more-actions"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? es.fewerActions : es.moreActions(pending.length - 2)}
          </button>
        )}
        {active.map((r) => (
          <article className="accepted-card" key={r.id}>
            <span className="accepted-icon">
              <BusIcon />
            </span>
            <div>
              <h3>{es.pending}</h3>
              <p>
                {state.dynamic.stations[r.station].name} ·{' '}
                {es.eta(Math.max(0, (r.acceptedTick ?? 0) + r.eta - state.tick))}
              </p>
              <span className="caption">{r.busIds?.join(' · ')}</span>
            </div>
            <button
              className="icon-button"
              aria-label={es.undo}
              title={state.tick >= (r.acceptedTick ?? 0) + r.eta ? es.toast.cannotUndo : es.undo}
              disabled={state.tick >= (r.acceptedTick ?? 0) + r.eta}
              onClick={() => {
                dispatch({ type: 'undo', id: r.id });
                notify(es.toast.undone);
              }}
            >
              <RotateCcw size={15} />
            </button>
          </article>
        ))}
        {pending.length === 0 && active.length === 0 && (
          <div className="empty-actions">
            <CircleCheck size={30} />
            <h3>{es.allActions}</h3>
            <p>{es.noActions}</p>
          </div>
        )}
      </div>
      <footer className="recommendation-footer">
        <kbd>A</kbd>
        <kbd>D</kbd>
        <span>{es.shortcutHint}</span>
      </footer>
      {confirmation && (
        <Dialog title={es.confirmTitle} onClose={() => setConfirmation(null)}>
          <p className="confirm-copy">
            {es.confirmBody(
              confirmation.from,
              routeGap(state.dynamic, confirmation.from, confirmation.count),
            )}
          </p>
          <div className="dialog-buttons">
            <button className="button secondary" onClick={() => setConfirmation(null)}>
              {es.cancel}
            </button>
            <button
              className="button primary"
              onClick={() => {
                act('accept', confirmation, true);
                setConfirmation(null);
              }}
            >
              {es.confirm}
            </button>
          </div>
        </Dialog>
      )}
    </aside>
  );
}
function BusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="5" y="3" width="14" height="17" rx="4" />
      <path d="M5 12h14M8 20v2m8-2v2M8 16h1m6 0h1" />
    </svg>
  );
}
