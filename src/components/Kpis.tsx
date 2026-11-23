import { Activity, BusFront, Clock3, Info, MapPin, TrendingDown } from 'lucide-react';
import { es } from '../i18n/es';
import { metrics } from '../sim/engine';
import { useSimulation } from '../state/useSimulation';

const keys = ['wait', 'full', 'saturated', 'gaps'] as const;
export function Kpis() {
  const { state } = useSimulation();
  const current = metrics(state[state.mode]);
  const baseline = metrics(state.fixed);
  const values = [current.wait, current.full, current.saturated, current.gaps];
  const previous = [baseline.wait, baseline.full, baseline.saturated, baseline.gaps];
  const icons = [Clock3, BusFront, MapPin, Activity];
  return (
    <section className="kpi-grid" aria-label={es.overview}>
      {values.map((value, index) => {
        const Icon = icons[index];
        const delta = +(previous[index] - value).toFixed(1);
        const series = state.samples[state.mode].map((sample) => sample[keys[index]]);
        const range = Math.max(1, Math.max(...series) - Math.min(...series));
        const points =
          series.length < 2
            ? '0,25 90,25'
            : series
                .map(
                  (v, i) =>
                    `${(i / (series.length - 1)) * 90},${34 - ((v - Math.min(...series)) / range) * 28}`,
                )
                .join(' ');
        return (
          <article className="card kpi-card" key={es.metrics[index]}>
            <div className="kpi-label">
              <span>
                <Icon size={16} />
                {es.metrics[index]}
              </span>
              <button type="button" className="tooltip" aria-label={es.metricHelp[index]}>
                <Info size={13} />
                <span role="tooltip">{es.metricHelp[index]}</span>
              </button>
            </div>
            <div className="kpi-value">
              <strong>{value.toLocaleString('es-PE', { maximumFractionDigits: 1 })}</strong>
              {index < 2 && <span>{index === 0 ? es.minute : '%'}</span>}
              <svg
                viewBox="0 0 90 40"
                className="sparkline"
                role="img"
                aria-label={`${es.metrics[index]}: ${series.join(', ')}`}
              >
                <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </div>
            <div className="kpi-bottom">
              {state.mode === 'dynamic' && index < 2 ? (
                <>
                  <span className="improvement">
                    <TrendingDown size={12} />
                    {delta} {index === 0 ? es.minute : 'pp'}
                  </span>
                  <span>{es.compared}</span>
                </>
              ) : (
                <>
                  <span className={`mini-dot ${value === 0 ? 'good' : ''}`} />
                  <span>
                    {state.mode === 'fixed'
                      ? es.noComparison
                      : index === 2
                        ? es.ofStations
                        : es.balanced}
                  </span>
                </>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
