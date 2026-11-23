import { useState } from 'react';
import { BusFront, ChevronDown, Clock3, MoveRight, Users } from 'lucide-react';
import { es } from '../i18n/es';
import { level } from '../sim/engine';
import { useSimulation } from '../state/useSimulation';
import { StatusBadge } from './ui';

const coordinates = [
  { x: 65, y: 91 },
  { x: 232, y: 91 },
  { x: 399, y: 91 },
  { x: 566, y: 91 },
  { x: 733, y: 91 },
  { x: 733, y: 253 },
  { x: 566, y: 253 },
  { x: 399, y: 253 },
  { x: 232, y: 253 },
  { x: 65, y: 253 },
];
function pointAt(position: number) {
  const index = Math.min(8, Math.floor(position));
  const start = coordinates[index];
  const end = coordinates[index + 1];
  const fraction = Math.min(1, position - index);
  if (index === 4) {
    const distance = fraction * 252;
    if (distance < 45) return { x: 733 + distance, y: 91 };
    if (distance < 207) return { x: 778, y: 91 + distance - 45 };
    return { x: 778 - (distance - 207), y: 253 };
  }
  return { x: start.x + (end.x - start.x) * fraction, y: start.y + (end.y - start.y) * fraction };
}
export function Network() {
  const { state } = useSimulation();
  const world = state[state.mode];
  const [selected, setSelected] = useState(5);
  const [route, setRoute] = useState('all');
  const station = world.stations[selected];
  const plotted = world.buses.filter((bus) =>
    route === 'all'
      ? Number(bus.id.slice(3)) % 5 === 0 || bus.state === 'reinforcement'
      : bus.route === route,
  );
  return (
    <section className="card network-card">
      <header className="card-header">
        <div>
          <h2>{es.network}</h2>
          <p>{es.networkSub}</p>
        </div>
        <div className="map-route">
          <label className="sr-only" htmlFor="map-route">
            {es.route}
          </label>
          <select id="map-route" value={route} onChange={(e) => setRoute(e.target.value)}>
            <option value="all">{es.allRoutes}</option>
            {es.routes.map((r) => (
              <option key={r} value={r}>
                {es.route} {r}
              </option>
            ))}
          </select>
          <ChevronDown size={13} />
        </div>
      </header>
      <div className="map-legend" aria-label={es.stationStatus}>
        {(['fluid', 'growing', 'saturated'] as const).map((status) => (
          <StatusBadge key={status} status={status} small />
        ))}
        <span className="map-direction">
          {es.towards}
          <MoveRight size={14} />
        </span>
      </div>
      <div className="network-canvas">
        <svg viewBox="0 0 835 335" role="group" aria-label={es.networkLabel}>
          <defs>
            <pattern id="map-dots" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.65" fill="#d9d9d9" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="805" height="335" fill="url(#map-dots)" />
          <path
            d="M65 91H733 Q778 91 778 136V208Q778 253 733 253H65"
            fill="none"
            className="route-outline"
            strokeWidth="11"
          />
          <path
            d="M65 91H733 Q778 91 778 136V208Q778 253 733 253H65"
            fill="none"
            className="route-line"
            strokeWidth="3"
          />
          <path
            d="m322 87 5 4-5 4m220-8 5 4-5 4M496 249l-5 4 5 4m-220-8-5 4 5 4"
            className="route-arrows"
            fill="none"
            strokeWidth="1.5"
          />
          {world.stations.map((s, index) => {
            const p = coordinates[index];
            const status = level(s.queue);
            const top = index < 5;
            return (
              <g
                key={s.id}
                className={`map-station ${status} ${selected === s.id ? 'active' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={selected === s.id}
                aria-label={es.stationMarker(s.name, s.queue, es.statuses[status])}
                onClick={() => setSelected(s.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(s.id);
                  }
                }}
              >
                <rect
                  x={p.x - 63}
                  y={top ? p.y - 69 : p.y + 14}
                  width="126"
                  height="51"
                  rx="8"
                  className="station-label-bg"
                />
                <text
                  x={p.x}
                  y={top ? p.y - 49 : p.y + 38}
                  textAnchor="middle"
                  className="station-name"
                >
                  {s.name}
                </text>
                <text
                  x={p.x}
                  y={top ? p.y - 31 : p.y + 56}
                  textAnchor="middle"
                  className="station-queue"
                >
                  {s.queue} {es.people}
                </text>
                <circle cx={p.x} cy={p.y} r="13" className="station-ring" />
                <circle cx={p.x} cy={p.y} r="6.5" className="station-dot" />
                {status === 'saturated' && (
                  <text x={p.x} y={p.y + 3.6} textAnchor="middle" className="station-warning">
                    !
                  </text>
                )}
              </g>
            );
          })}
          {plotted.map((bus, index) => {
            const p = pointAt(bus.position);
            const top = bus.position < 4.6;
            const y = p.y + (top ? 30 : -31) + (index % 2) * 3;
            return (
              <g
                key={bus.id}
                className="map-bus"
                aria-label={es.busMarker(bus.id, bus.route, bus.occupancy)}
              >
                <title>{es.busMarker(bus.id, bus.route, bus.occupancy)}</title>
                <line x1={p.x} x2={p.x} y1={p.y} y2={y} stroke="#d4d4d4" strokeDasharray="2 2" />
                <rect
                  x={p.x - 22}
                  y={y - 10}
                  width="44"
                  height="21"
                  rx="6"
                  className={
                    bus.occupancy > 90
                      ? 'bus-full'
                      : bus.state === 'reinforcement'
                        ? 'bus-reinforcement'
                        : 'bus-normal'
                  }
                />
                <path
                  d={`M${p.x - 15} ${y - 5}h9v9h-9zm0 3h9m-7 7v2m5-2v2`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <text x={p.x + 8} y={y + 3.5} textAnchor="middle">
                  {bus.occupancy}%
                </text>
              </g>
            );
          })}
          <g transform="translate(310 169)" className="map-center-label">
            <BusFront size={15} />
            <text x="23" y="12">
              {es.activeFleet} · {world.buses.length}
            </text>
          </g>
        </svg>
      </div>
      <div className="mobile-trunk" aria-label={es.networkLabel}>
        {world.stations.map((s) => (
          <button
            key={s.id}
            className={`mobile-station ${selected === s.id ? 'selected' : ''}`}
            aria-pressed={selected === s.id}
            onClick={() => setSelected(s.id)}
          >
            <span className={`trunk-point ${level(s.queue)}`} />
            <span>
              <strong>{s.name}</strong>
              <span>
                {s.queue} {es.people}
              </span>
            </span>
            <StatusBadge status={level(s.queue)} small />
          </button>
        ))}
      </div>
      <div className="station-detail">
        <div className="detail-station">
          <span className="station-symbol">
            <BusFront size={17} />
          </span>
          <div>
            <span className="eyebrow">{es.selectedStation}</span>
            <h3>{station.name}</h3>
          </div>
          <StatusBadge status={level(station.queue)} small />
        </div>
        <div className="detail-numbers">
          <span>
            <Users size={14} />
            <strong>{station.queue}</strong> {es.queue.toLowerCase()}
          </span>
          <span>
            <Clock3 size={14} />
            <strong>{station.forecast[2]}</strong> / 15 min
          </span>
        </div>
        <div
          className="forecast-mini"
          role="img"
          aria-label={`${es.forecastCaption}: ${station.forecast.join(', ')}`}
        >
          <div>
            {station.forecast.map((n, i) => (
              <span
                key={i}
                className={i === 2 ? 'current' : ''}
                style={{ height: `${Math.max(8, (n / Math.max(...station.forecast)) * 27)}px` }}
              />
            ))}
          </div>
          <span>{es.forecast}</span>
        </div>
      </div>
    </section>
  );
}
