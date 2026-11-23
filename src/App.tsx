import { useEffect, useState } from 'react';
import {
  BusFront,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FlaskConical,
  History,
  LayoutDashboard,
  MapPin,
  PanelLeft,
  RotateCcw,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { es } from './i18n/es';
import { Operator } from './pages/Operator';
import { Passenger } from './pages/Passenger';
import { Help } from './components/ui';
import { useSimulation } from './state/useSimulation';
import { readStored, writeStored } from './state/context';
import { simTime } from './sim/engine';

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/operador" className="brand" aria-label={`${es.brand} · ${es.backHome}`}>
      <span className="brand-mark">
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 17V7h4l5 7 5-7h4v10h-4v-4l-5 6-5-6v4H3Z" fill="currentColor" />
        </svg>
      </span>
      {!compact && (
        <span>
          {es.brand}
          <span className="brand-period">.</span>
        </span>
      )}
    </Link>
  );
}
export default function App() {
  const location = useLocation();
  const passenger = location.pathname === '/pasajero';
  const panel = new URLSearchParams(location.search).get('panel');
  const { state, dispatch, toast, notify } = useSimulation();
  const [help, setHelp] = useState(false);
  const [tour, setTour] = useState<number | null>(() =>
    readStored<boolean>('metro-tour-done', false) ? null : 0,
  );
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    if (state.tick === 0) setAnnouncement('');
    if (state.tick > 0 && state.tick % 10 === 0) setAnnouncement(es.minuteUpdate(simTime(state)));
  }, [state]);
  useEffect(() => {
    document.title = `${es.brand} · ${passenger ? es.passenger : es.operations}`;
    window.scrollTo(0, 0);
  }, [passenger]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (
        event.key !== '?' ||
        (event.target as HTMLElement).closest('input,select,textarea,[contenteditable="true"]') ||
        document.querySelector('dialog[open]')
      )
        return;
      setHelp(true);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
  const finishTour = () => {
    setTour(null);
    writeStored('metro-tour-done', true);
  };
  const links = [
    { label: es.overview, icon: LayoutDashboard, path: '/operador', key: null },
    { label: es.fleet, icon: BusFront, path: '/operador?panel=buses', key: 'buses' },
    { label: es.stations, icon: MapPin, path: '/operador?panel=stations', key: 'stations' },
    { label: es.decisions, icon: History, path: '/operador?panel=history', key: 'history' },
  ];
  return (
    <div className={passenger ? 'app passenger-app' : 'app'}>
      <a className="skip-link" href="#main-content">
        {es.skipContent}
      </a>
      {!passenger && (
        <aside className="sidebar">
          <Logo />
          <div className="workspace-card">
            <span className="workspace-icon">
              <BusFront size={19} />
            </span>
            <div>
              <strong>{es.workspaceName}</strong>
              <span>{es.workspaceSub}</span>
            </div>
            <ChevronDown size={13} />
          </div>
          <span className="nav-label">{es.operation}</span>
          <nav aria-label={es.navigation}>
            {links.map(({ label, icon: Icon, path, key }) => (
              <Link
                key={label}
                to={path}
                className={`nav-link ${panel === key ? 'active' : ''}`}
                aria-current={panel === key ? 'page' : undefined}
                aria-label={label}
              >
                <Icon size={17} />
                <span>{label}</span>
                {key === 'buses' && <span className="nav-count">40</span>}
                {key === 'history' && state.decisions.length > 0 && (
                  <span className="nav-count">{state.decisions.length}</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-note">
              <span className="sidebar-note-icon">
                <Sparkles size={19} />
              </span>
              <h3>{es.tagline}</h3>
              <p>{es.actionsSub}</p>
              <button onClick={() => setHelp(true)}>
                {es.how}
                <ChevronRight size={13} />
              </button>
            </div>
            <button className="nav-link help-link" onClick={() => setHelp(true)}>
              <CircleHelp size={17} />
              {es.help}
              <kbd>?</kbd>
            </button>
            <div className="operator-profile">
              <span className="avatar">{es.operatorInitials}</span>
              <div>
                <strong>{es.profile}</strong>
                <span>{es.control}</span>
              </div>
              <span className="profile-online" title={es.online} />
            </div>
          </div>
        </aside>
      )}
      <div className="app-content">
        <header className="topbar">
          {passenger ? (
            <Logo />
          ) : (
            <div className="breadcrumb">
              <PanelLeft size={17} />
              <span>{es.operation.charAt(0) + es.operation.slice(1).toLowerCase()}</span>
              <ChevronRight size={13} />
              <strong>{es.operations}</strong>
            </div>
          )}
          <div className="header-right">
            <span className="prototype-badge">
              <FlaskConical size={13} />
              {es.simulated}
            </span>
            <nav className="view-switch" aria-label={es.workspace}>
              <Link
                to="/operador"
                aria-label={es.operator}
                className={!passenger ? 'active' : ''}
                aria-current={!passenger ? 'page' : undefined}
              >
                <LayoutDashboard size={14} />
                <span data-short={es.operatorShort}>{es.operator}</span>
              </Link>
              <Link
                to="/pasajero"
                aria-label={es.passenger}
                className={passenger ? 'active' : ''}
                aria-current={passenger ? 'page' : undefined}
              >
                <Smartphone size={14} />
                <span data-short={es.passengerShort}>{es.passenger}</span>
              </Link>
            </nav>
            {passenger && (
              <button
                className="icon-button passenger-help"
                aria-label={es.how}
                onClick={() => setHelp(true)}
              >
                <CircleHelp size={19} />
              </button>
            )}
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Navigate to="/operador" replace />} />
            <Route path="/operador" element={<Operator />} />
            <Route path="/pasajero" element={<Passenger />} />
            <Route
              path="*"
              element={
                <div className="not-found">
                  <MapPin size={40} />
                  <h1>{es.notFound}</h1>
                  <p>{es.notFoundSub}</p>
                  <Link to="/operador" className="button primary">
                    {es.backHome}
                  </Link>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
      {help && (
        <Help
          onClose={() => setHelp(false)}
          onTour={() => {
            setHelp(false);
            setTour(0);
          }}
        />
      )}
      {tour !== null && (
        <aside className="tour-card" aria-label={es.tourOpen}>
          <div className="tour-top">
            <span>
              <Sparkles size={14} />
              {es.tourProgress(tour + 1)}
            </span>
            <button className="icon-button" aria-label={es.skip} onClick={finishTour}>
              <X size={16} />
            </button>
          </div>
          <h2>{es.tourTitle[tour]}</h2>
          <p>{es.tourBody[tour]}</p>
          <div className="tour-bottom">
            <div className="tour-dots">
              {es.tourTitle.map((_, i) => (
                <span key={i} className={i === tour ? 'active' : ''} />
              ))}
            </div>
            <button
              className="button primary"
              onClick={() => (tour === 2 ? finishTour() : setTour(tour + 1))}
            >
              {tour === 2 ? es.start : es.next}
            </button>
          </div>
        </aside>
      )}
      {toast && (
        <div className="toast" role="status">
          <span className="toast-check">✓</span>
          <p>{toast.message}</p>
          {toast.undoId && (
            <button
              onClick={() => {
                const rec = state.recommendations.find((r) => r.id === toast.undoId);
                if (rec?.status === 'accepted' && state.tick < (rec.acceptedTick ?? 0) + rec.eta) {
                  dispatch({ type: 'undo', id: toast.undoId! });
                  notify(es.toast.undone);
                } else notify(es.toast.cannotUndo);
              }}
            >
              <RotateCcw size={14} />
              {es.undo}
            </button>
          )}
        </div>
      )}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <button
        className="tour-reopen"
        onClick={() => setHelp(true)}
        aria-label={es.how}
        title={es.how}
      >
        <CircleHelp size={16} />
      </button>
    </div>
  );
}
