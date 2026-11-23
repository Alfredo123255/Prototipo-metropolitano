import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownUp,
  BusFront,
  Check,
  ChevronDown,
  Clock3,
  Coffee,
  Heart,
  LoaderCircle,
  MapPin,
  Navigation,
  RotateCcw,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { es } from '../i18n/es';
import { ROUTES } from '../data/mocks';
import { level, simTime, upcomingBuses } from '../sim/engine';
import { useSimulation } from '../state/useSimulation';
import { readStored, writeStored } from '../state/context';
import { Occupancy, StatusBadge } from '../components/ui';

interface Preference {
  station: number;
  route: string;
}
function validPreference(value: unknown): value is Preference {
  if (!value || typeof value !== 'object') return false;
  const p = value as Preference;
  return (
    Number.isInteger(p.station) &&
    p.station >= 0 &&
    p.station < 10 &&
    ROUTES.some((r) => r === p.route)
  );
}
export function Passenger() {
  const { state, notify } = useSimulation();
  const [stored] = useState(() =>
    readStored<unknown>('metro-trip', { station: 5, route: 'Expreso 1' }),
  );
  const [preference, setPreference] = useState<Preference>(
    validPreference(stored) ? stored : { station: 5, route: 'Expreso 1' },
  );
  const [view, setView] = useState<'ready' | 'loading' | 'error' | 'empty'>(
    validPreference(stored) ? 'loading' : 'error',
  );
  const [favorite, setFavorite] = useState(
    () => readStored<boolean>('metro-trip-favorite', false) === true,
  );
  const world = state[state.mode];
  const station = world.stations[preference.station];
  const buses = upcomingBuses(world, preference.station, preference.route, state.tick);
  const next = buses[0];
  const roomier = buses.slice(1).find((b) => next && b.occupancy < 70 && b.eta > next.eta);
  const nearby = world.stations
    .filter((s) => Math.abs(s.id - station.id) === 1 && s.queue < station.queue)
    .sort((a, b) => a.queue - b.queue)[0];
  const reinforcement =
    state.mode === 'dynamic' &&
    world.buses.some((b) => b.target === station.id && b.state === 'reinforcement');
  useEffect(() => {
    if (view !== 'loading') return;
    const id = window.setTimeout(() => setView('ready'), 450);
    return () => window.clearTimeout(id);
  }, [view, preference]);
  const choose = (nextPreference: Preference) => {
    setPreference(nextPreference);
    writeStored('metro-trip', nextPreference);
    setView('loading');
    notify(es.toast.saved);
  };
  return (
    <div className="passenger-page">
      <section className="passenger-intro">
        <div className="passenger-kicker">
          <span className="live-dot" />
          {es.passengerEyebrow}
        </div>
        <h1>
          {es.passengerHeading.split('\n').map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </h1>
        <p>{es.passengerDescription}</p>
        <div className="passenger-intro-note">
          <Navigation size={16} />
          {es.lima}
          <span>·</span>
          {es.scenarios[state.scenario]}
        </div>
        <div className="journey-illustration" aria-hidden="true">
          <div className="journey-line" />
          <span className="journey-dot start" />
          <span className="journey-dot end" />
          <div className="illustrated-bus">
            <BusFront size={40} strokeWidth={1.2} />
            <span>{es.brand}</span>
          </div>
          <div className="journey-mini">
            <Users size={16} />
            <span>{es.space}</span>
            <Check size={14} />
          </div>
        </div>
      </section>
      <div className="passenger-phone">
        <div className="trip-top">
          <span>
            <MapPin size={14} />
            {es.towards}
          </span>
          <span className="tabular">
            {simTime(state)}
            <span className={`live-dot ${state.paused ? 'is-paused' : ''}`} />
          </span>
        </div>
        <div className="trip-selectors">
          <div>
            <label htmlFor="passenger-station">{es.yourStation}</label>
            <div className="trip-select">
              <MapPin size={18} />
              <select
                id="passenger-station"
                value={preference.station}
                onChange={(e) => choose({ ...preference, station: Number(e.target.value) })}
              >
                {world.stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
          <div className="trip-route-row">
            <label htmlFor="passenger-route">{es.yourRoute}</label>
            <div className="trip-select">
              <BusFront size={16} />
              <select
                id="passenger-route"
                value={preference.route}
                onChange={(e) => choose({ ...preference, route: e.target.value })}
              >
                {es.routes.map((r) => (
                  <option key={r} value={r}>
                    {es.route} {r}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
            <button
              className={`icon-button favorite-trip ${favorite ? 'is-favorite' : ''}`}
              aria-label={favorite ? es.unfavorite : es.favorite}
              aria-pressed={favorite}
              onClick={() => {
                setFavorite(!favorite);
                writeStored('metro-trip-favorite', !favorite);
                notify(es.toast.favorite);
              }}
            >
              <Star size={19} fill={favorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
        {view === 'loading' ? (
          <div className="passenger-state" role="status">
            <LoaderCircle className="loading-spinner" size={28} />
            <h2>{es.loading}</h2>
            <p>{es.loadingSub}</p>
          </div>
        ) : view === 'error' ? (
          <div className="passenger-state" role="alert">
            <AlertTriangle size={28} />
            <h2>{es.errorTitle}</h2>
            <p>{es.errorSub}</p>
            <button
              className="button primary"
              onClick={() => choose({ station: 5, route: 'Expreso 1' })}
            >
              <RotateCcw size={15} />
              {es.retry}
            </button>
          </div>
        ) : view === 'empty' || !next ? (
          <div className="passenger-state">
            <BusFront size={28} />
            <h2>{es.noBusesTitle}</h2>
            <p>{es.noBusesSub}</p>
            <button className="button primary" onClick={() => setView('loading')}>
              {es.retry}
            </button>
          </div>
        ) : (
          <>
            <section className="next-bus-card">
              <div className="next-bus-eyebrow">
                <span>{es.nextBus}</span>
                <BusFront size={20} />
              </div>
              <div className="arrival-time">
                <strong>{next.eta}</strong>
                <span>{es.minute}</span>
                <span className="arrival-route">
                  {es.route} {next.route}
                </span>
              </div>
              <div className="next-bus-occupancy">
                <div>
                  <span>{es.occupancy}</span>
                  <strong>
                    {next.occupancy}% ·{' '}
                    {
                      es.occupancyLabels[
                        next.occupancy < 30
                          ? 0
                          : next.occupancy < 70
                            ? 1
                            : next.occupancy <= 90
                              ? 2
                              : 3
                      ]
                    }
                  </strong>
                </div>
                <Occupancy value={next.occupancy} label={false} />
              </div>
              <div className="next-bus-footer">
                <span>
                  <Check size={14} />
                  {next.occupancy < 70 ? es.space : es.crowded}
                </span>
                <span>{next.id}</span>
              </div>
            </section>
            <section className="station-passenger-status">
              <div>
                <span>{es.stationStatus}</span>
                <StatusBadge status={level(station.queue)} />
              </div>
              <p>
                <Users size={14} />
                {station.queue} {es.people.toLowerCase()} {es.queue.toLowerCase()}
                <span>·</span>
                {es.boarding}
              </p>
              <div className="passenger-legend" aria-label={es.stationStatus}>
                {(['fluid', 'growing', 'saturated'] as const).map((status) => (
                  <StatusBadge key={status} status={status} small />
                ))}
              </div>
            </section>
            {reinforcement && (
              <div className="reinforcement-notice" role="status">
                <Sparkles size={17} />
                <p>{es.reinforcementNotice}</p>
              </div>
            )}
            <section className="upcoming-list">
              <header>
                <h2>{es.nextBuses}</h2>
                <Clock3 size={15} />
              </header>
              {buses.slice(1, 4).map((b) => (
                <article key={b.id}>
                  <span className="upcoming-bus-icon">
                    <BusFront size={20} />
                  </span>
                  <div className="upcoming-bus-data">
                    <strong>
                      {es.route} {b.route}
                    </strong>
                    <Occupancy value={b.occupancy} />
                  </div>
                  <div className="upcoming-time">
                    <strong>{b.eta}</strong>
                    <span>{es.minute}</span>
                  </div>
                </article>
              ))}
            </section>
            <section className="alternative-card">
              <span className="alternative-icon">
                {roomier ? <Coffee size={19} /> : <Navigation size={19} />}
              </span>
              <div>
                <h3>
                  {roomier ? es.alternativeTitle : nearby ? es.nearbyTitle : es.goodFlowTitle}
                </h3>
                <p>
                  {roomier
                    ? es.alternative(roomier.eta - next.eta)
                    : nearby
                      ? es.nearby(nearby.name, nearby.queue)
                      : es.goodFlow}
                </p>
              </div>
            </section>
          </>
        )}
        <div className="passenger-live">
          <span className={`live-dot ${state.paused ? 'is-paused' : ''}`} />
          {state.paused ? es.paused : es.online}
          <span>·</span>
          {es.simulatedTime} {simTime(state)}
        </div>
        <details className="demo-states">
          <summary>{es.demoStates}</summary>
          <div>
            <button onClick={() => setView('empty')}>{es.previewEmpty}</button>
            <button onClick={() => setView('error')}>{es.previewError}</button>
            <button onClick={() => setView('loading')}>
              <ArrowDownUp size={12} />
              {es.exitPreview}
            </button>
          </div>
        </details>
      </div>
      <footer className="passenger-footer">
        <Heart size={13} />
        {es.passengerFooter}
      </footer>
    </div>
  );
}
