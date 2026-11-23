import { useEffect, useMemo, useState } from 'react';
import {
  BusFront,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { es } from '../i18n/es';
import { PROFILES } from '../data/mocks';
import { formatTime, level } from '../sim/engine';
import { useSimulation } from '../state/useSimulation';
import { readStored, writeStored } from '../state/context';
import { Occupancy, StatusBadge } from './ui';

type Tab = 'buses' | 'stations' | 'history';
export function ActivityTable() {
  const { state, dispatch, notify } = useSimulation();
  const [params, setParams] = useSearchParams();
  const panel = params.get('panel');
  const tab: Tab = panel === 'stations' || panel === 'history' ? panel : 'buses';
  const [query, setQuery] = useState('');
  const [route, setRoute] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('name');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<number[]>(() => {
    const stored = readStored<unknown>('metro-favorites', []);
    return Array.isArray(stored) ? stored.filter((id): id is number => typeof id === 'number') : [];
  });
  const [page, setPage] = useState(1);
  const world = state[state.mode];
  useEffect(() => {
    setQuery('');
    setRoute('all');
    setStatus('all');
    setSort('name');
    setPage(1);
  }, [tab]);
  const filteredBuses = useMemo(
    () =>
      world.buses
        .filter(
          (b) =>
            (route === 'all' || b.route === route) &&
            (status === 'all' || b.state === status) &&
            `${b.id} ${world.stations[Math.min(9, Math.ceil(b.position))].name}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === 'occupancy' ? b.occupancy - a.occupancy : a.id.localeCompare(b.id),
        ),
    [world, route, status, query, sort],
  );
  const filteredStations = useMemo(
    () =>
      world.stations
        .filter(
          (s) =>
            (status === 'all' || level(s.queue) === status) &&
            (!favoritesOnly || favorites.includes(s.id)) &&
            s.name.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) => (sort === 'queue' ? b.queue - a.queue : a.name.localeCompare(b.name))),
    [world, status, favoritesOnly, favorites, query, sort],
  );
  const count =
    tab === 'buses'
      ? filteredBuses.length
      : tab === 'stations'
        ? filteredStations.length
        : state.decisions.length;
  const pages = Math.max(1, Math.ceil(count / 6));
  const currentPage = Math.min(page, pages);
  const sliceStart = (currentPage - 1) * 6;
  const clear = () => {
    setQuery('');
    setRoute('all');
    setStatus('all');
    setSort('name');
    setFavoritesOnly(false);
    setPage(1);
  };
  return (
    <section className="card activity-card" id="activity">
      <header className="activity-header">
        <h2>{es.activity}</h2>
        <span className="caption fleet-context">{es.fleetContext}</span>
      </header>
      <div
        className="table-tabs"
        role="tablist"
        aria-label={es.activity}
        onKeyDown={(event) => {
          const tabs: Tab[] = ['buses', 'stations', 'history'];
          const index = tabs.indexOf(tab);
          const next =
            event.key === 'ArrowRight'
              ? (index + 1) % 3
              : event.key === 'ArrowLeft'
                ? (index + 2) % 3
                : event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? 2
                    : -1;
          if (next < 0) return;
          event.preventDefault();
          setParams({ panel: tabs[next] }, { replace: true });
          document.getElementById(`tab-${tabs[next]}`)?.focus();
        }}
      >
        {(['buses', 'stations', 'history'] as const).map((id, i) => (
          <button
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            aria-controls="activity-panel"
            key={id}
            className={tab === id ? 'active' : ''}
            onClick={() => setParams({ panel: id }, { replace: true })}
          >
            {[es.busTab, es.stationTab, es.historyTab][i]}
            {id === 'buses' && <span>40</span>}
            {id === 'history' && state.decisions.length > 0 && (
              <span>{state.decisions.length}</span>
            )}
          </button>
        ))}
      </div>
      <div id="activity-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
        {tab !== 'history' && (
          <div className="table-filters">
            <div className="search-field">
              <Search size={15} />
              <input
                aria-label={es.search}
                placeholder={es.search}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="table-select">
              <SlidersHorizontal size={14} />
              <select
                aria-label={es.filterStatus}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">{es.allStates}</option>
                {tab === 'buses' ? (
                  <>
                    <option value="service">{es.service}</option>
                    <option value="reinforcement">{es.reinforcement}</option>
                  </>
                ) : (
                  Object.entries(es.statuses).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown size={12} />
            </div>
            {tab === 'buses' ? (
              <div className="table-select">
                <select
                  aria-label={es.route}
                  value={route}
                  onChange={(e) => {
                    setRoute(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">{es.allRoutes}</option>
                  {es.routes.map((r) => (
                    <option key={r} value={r}>
                      {es.route} {r}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} />
              </div>
            ) : (
              <button
                className={`button favorite-filter ${favoritesOnly ? 'selected' : ''}`}
                aria-pressed={favoritesOnly}
                onClick={() => {
                  setFavoritesOnly(!favoritesOnly);
                  setPage(1);
                }}
              >
                <Star size={14} />
                {es.favorites}
              </button>
            )}
            <div className="table-select sort-select">
              <select
                aria-label={es.sort}
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                <option value="name">{es.nameSort}</option>
                <option value={tab === 'buses' ? 'occupancy' : 'queue'}>
                  {tab === 'buses' ? es.occupancySort : es.queueSort}
                </option>
              </select>
              <ChevronDown size={12} />
            </div>
          </div>
        )}
        {count === 0 ? (
          <div className="table-empty">
            <Search size={24} />
            <h3>{tab === 'history' ? es.emptyHistory : es.noResults}</h3>
            {tab === 'history' ? (
              <p>{es.emptyHistorySub}</p>
            ) : (
              <button className="button secondary" onClick={clear}>
                {es.clearFilters}
              </button>
            )}
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {(tab === 'buses'
                    ? [es.bus, es.route, es.position, es.occupancy, es.status]
                    : tab === 'stations'
                      ? [es.station, es.queue, es.forecast, es.status, es.favorites]
                      : [es.simulatedTime, es.decisions, es.station, es.buses, es.undo]
                  ).map((h) => (
                    <th scope="col" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tab === 'buses' &&
                  filteredBuses.slice(sliceStart, sliceStart + 6).map((bus) => (
                    <tr key={bus.id}>
                      <td>
                        <span className="bus-name">
                          <BusFront size={15} />
                          {bus.id}
                        </span>
                      </td>
                      <td>
                        <span className="route-tag">{bus.route}</span>
                      </td>
                      <td>{world.stations[Math.min(9, Math.ceil(bus.position))].name}</td>
                      <td>
                        <Occupancy value={bus.occupancy} />
                      </td>
                      <td>
                        <span
                          className={`service-badge ${bus.state === 'reinforcement' ? 'is-reinforcement' : ''}`}
                        >
                          <Check size={12} />
                          {bus.state === 'service' ? es.service : es.reinforcement}
                        </span>
                      </td>
                    </tr>
                  ))}
                {tab === 'stations' &&
                  filteredStations.slice(sliceStart, sliceStart + 6).map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong className="station-table-name">{s.name}</strong>
                      </td>
                      <td>
                        {s.queue} <span className="muted">{es.people}</span>
                      </td>
                      <td>
                        {s.forecast[2]} <span className="muted">/ 15 min</span>
                      </td>
                      <td>
                        <StatusBadge status={level(s.queue)} small />
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`${favorites.includes(s.id) ? es.unfavorite : es.favorite}: ${s.name}`}
                          aria-pressed={favorites.includes(s.id)}
                          onClick={() => {
                            const next = favorites.includes(s.id)
                              ? favorites.filter((id) => id !== s.id)
                              : [...favorites, s.id];
                            setFavorites(next);
                            writeStored('metro-favorites', next);
                            notify(es.toast.favorite);
                          }}
                        >
                          <Star
                            size={16}
                            fill={favorites.includes(s.id) ? 'currentColor' : 'none'}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                {tab === 'history' &&
                  state.decisions.slice(sliceStart, sliceStart + 6).map((decision) => {
                    const rec = state.recommendations.find(
                      (r) => r.id === decision.recommendationId,
                    );
                    const canUndo =
                      decision.action === 'accepted' &&
                      rec?.status === 'accepted' &&
                      state.tick < (rec.acceptedTick ?? 0) + rec.eta;
                    return (
                      <tr key={decision.id}>
                        <td className="tabular">
                          {formatTime(PROFILES[state.scenario].start + decision.tick)}
                        </td>
                        <td>{es.log[decision.action]}</td>
                        <td>{world.stations[decision.station].name}</td>
                        <td>{decision.busIds.join(', ') || '—'}</td>
                        <td>
                          {decision.action === 'accepted' && (
                            <button
                              className="button text-button"
                              disabled={!canUndo}
                              title={!canUndo ? es.toast.cannotUndo : es.undo}
                              onClick={() => {
                                dispatch({ type: 'undo', id: decision.recommendationId });
                                notify(es.toast.undone);
                              }}
                            >
                              <RotateCcw size={14} />
                              {es.undo}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <footer className="table-footer">
        <span>
          {es.results(
            count,
            tab === 'buses' ? 40 : tab === 'stations' ? 10 : state.decisions.length,
          )}
        </span>
        <div>
          <span>{es.page(currentPage, pages)}</span>
          <button
            className="icon-button"
            aria-label={es.previous}
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="icon-button"
            aria-label={es.next}
            disabled={currentPage === pages}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    </section>
  );
}
