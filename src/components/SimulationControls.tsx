import { ChevronDown, Pause, Play, RotateCcw, SkipForward, Sun } from 'lucide-react';
import { es } from '../i18n/es';
import { SCENARIOS } from '../data/mocks';
import type { ScenarioId } from '../data/types';
import { useSimulation } from '../state/useSimulation';

export function SimulationControls() {
  const { state, dispatch, notify } = useSimulation();
  return (
    <section className="simulation-controls" aria-label={es.scenario}>
      <div className="scenario-field">
        <Sun size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor="scenario">
          {es.scenario}
        </label>
        <select
          id="scenario"
          value={state.scenario}
          onChange={(e) => {
            dispatch({ type: 'scenario', scenario: e.target.value as ScenarioId });
            notify(es.toast.scenario);
          }}
        >
          {SCENARIOS.map((id) => (
            <option key={id} value={id}>
              {es.scenarios[id]}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="select-chevron" />
      </div>
      <div className="mode-switch" role="group" aria-label={es.compare}>
        {(['fixed', 'dynamic'] as const).map((mode) => (
          <button
            key={mode}
            className={state.mode === mode ? 'selected' : ''}
            aria-pressed={state.mode === mode}
            onClick={() => {
              dispatch({ type: 'mode', mode });
              notify(es.toast.mode(mode === 'dynamic'));
            }}
          >
            {mode === 'dynamic' && <span className="mode-dot" />}
            {mode === 'dynamic' ? es.dynamic : es.fixed}
          </button>
        ))}
      </div>
      <div className="playback">
        <button
          className="icon-button playback-toggle"
          title={`${state.paused ? es.play : es.pause} (Espacio)`}
          aria-label={state.paused ? es.play : es.pause}
          onClick={() => dispatch({ type: 'pause' })}
        >
          {state.paused ? (
            <Play size={16} fill="currentColor" />
          ) : (
            <Pause size={16} fill="currentColor" />
          )}
        </button>
        <div className="speed-switch" role="group" aria-label={es.speed}>
          {([1, 5, 10] as const).map((speed) => (
            <button
              key={speed}
              onClick={() => dispatch({ type: 'speed', speed })}
              className={state.speed === speed ? 'selected' : ''}
              aria-pressed={state.speed === speed}
            >
              ×{speed}
            </button>
          ))}
        </div>
        <span className="control-divider" />
        <button
          className="icon-button"
          title={es.step}
          aria-label={es.step}
          onClick={() => dispatch({ type: 'tick' })}
        >
          <SkipForward size={16} />
        </button>
        <button
          className="icon-button"
          title={es.reset}
          aria-label={es.reset}
          onClick={() => {
            dispatch({ type: 'reset' });
            notify(es.toast.reset);
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </section>
  );
}
