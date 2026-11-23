import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronRight, Clock3, MapPin, Radio } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { es } from '../i18n/es';
import { useSimulation } from '../state/useSimulation';
import { level, simTime } from '../sim/engine';
import { SimulationControls } from '../components/SimulationControls';
import { Kpis } from '../components/Kpis';
import { Network } from '../components/Network';
import { Recommendations } from '../components/Recommendations';
import { ActivityTable } from '../components/ActivityTable';

export function Operator() {
  const { state } = useSimulation();
  const [params] = useSearchParams();
  const panel = params.get('panel');
  const [age, setAge] = useState(0);
  useEffect(() => {
    const id = window.setInterval(
      () => setAge(Math.floor((Date.now() - state.updatedAt) / 1000)),
      1000,
    );
    setAge(0);
    return () => window.clearInterval(id);
  }, [state.updatedAt]);
  useEffect(() => {
    if (panel)
      document.getElementById('activity')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      });
  }, [panel]);
  const world = state[state.mode];
  const saturated = world.stations.filter((s) => level(s.queue) === 'saturated');
  const full = world.buses.find((b) => b.occupancy > 90);
  return (
    <div className="operator-page">
      <section className="page-heading">
        <div>
          <div className="eyebrow heading-eyebrow">
            <span className={`live-dot ${state.paused ? 'is-paused' : ''}`} />
            {state.paused ? es.paused : es.online}
            <span className="heading-divider">/</span>
            <span className="heading-location">{es.lima}</span>
          </div>
          <h1>{es.heading}</h1>
          <p>{es.description}</p>
        </div>
        <div className="simulation-clock">
          <div>
            <Clock3 size={15} />
            <span>{es.simulatedTime}</span>
          </div>
          <strong>
            {simTime(state)}
            <span>{es.timezoneShort}</span>
          </strong>
          <small>{es.update(age)}</small>
        </div>
      </section>
      <SimulationControls />
      <Kpis />
      <div className="operations-grid">
        <div className="network-column">
          <Network />
          <section className="alerts-strip" aria-label={es.alerts}>
            <span className="alert-icon">
              <AlertTriangle size={17} />
            </span>
            <div>
              <strong>{es.alerts}</strong>
              <p>
                {saturated[0]
                  ? es.saturatedAlert(saturated[0].name, saturated[0].queue)
                  : es.noAlerts}
                {full && <span className="secondary-alert"> {es.fullAlert(full.id)}</span>}
              </p>
            </div>
            <span className="alert-count">{saturated.length + (full ? 1 : 0)}</span>
            <ChevronRight size={15} />
          </section>
        </div>
        <Recommendations />
      </div>
      <ActivityTable />
      <footer className="page-footer">
        <span>
          <Radio size={13} />
          {es.footer}
        </span>
        <span>
          <MapPin size={12} />
          {es.lima} <span className="footer-separator">·</span>{' '}
          {state.mode === 'dynamic' ? es.dynamicCaption : es.fixedCaption}
        </span>
      </footer>
    </div>
  );
}
