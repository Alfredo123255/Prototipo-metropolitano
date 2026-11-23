import { describe, expect, it } from 'vitest';
import { initialState, metrics, simulationReducer, upcomingBuses } from './engine';
import { SCENARIOS } from '../data/mocks';

describe('simulación MetroFlujo', () => {
  it('repite exactamente las mismas colas y buses con una semilla fija', () => {
    let first = initialState();
    let second = initialState();
    for (let i = 0; i < 50; i++) {
      first = simulationReducer(first, { type: 'tick' });
      second = simulationReducer(second, { type: 'tick' });
    }
    expect(first.dynamic).toEqual(second.dynamic);
    expect(first.fixed).toEqual(second.fixed);
  });
  it('escala las llegadas y reduce la cola al llegar un refuerzo', () => {
    let reinforced = simulationReducer(initialState(), { type: 'accept', id: 'rec-1' });
    let control = initialState();
    const buses = reinforced.dynamic.buses.filter((b) => b.state === 'reinforcement');
    expect(buses.map((b) => b.arrivalTick)).toEqual([3, 4]);
    for (let i = 0; i < 4; i++) {
      reinforced = simulationReducer(reinforced, { type: 'tick' });
      control = simulationReducer(control, { type: 'tick' });
    }
    expect(reinforced.dynamic.stations[5].queue).toBeLessThan(
      control.dynamic.stations[5].queue - 150,
    );
    expect(reinforced.recommendations[0].status).toBe('completed');
    expect(reinforced.fixed).toEqual(control.fixed);
  });
  it('restaura los buses originales al deshacer y rechaza deshacer tras el embarque', () => {
    const initial = initialState();
    const accepted = simulationReducer(initial, { type: 'accept', id: 'rec-1' });
    const undone = simulationReducer(accepted, { type: 'undo', id: 'rec-1' });
    expect(undone.dynamic.buses).toEqual(initial.dynamic.buses);
    let arrived = accepted;
    for (let i = 0; i < 3; i++) arrived = simulationReducer(arrived, { type: 'tick' });
    expect(simulationReducer(arrived, { type: 'undo', id: 'rec-1' })).toBe(arrived);
  });
  it('impide dejar huecos sin confirmación y aplicar refuerzos en modo fijo', () => {
    const state = initialState();
    expect(simulationReducer(state, { type: 'accept', id: 'rec-3' })).toBe(state);
    expect(
      simulationReducer(state, { type: 'accept', id: 'rec-3', force: true }).decisions,
    ).toHaveLength(1);
    const fixed = simulationReducer(state, { type: 'mode', mode: 'fixed' });
    expect(simulationReducer(fixed, { type: 'accept', id: 'rec-1' })).toBe(fixed);
  });
  it('recupera una recomendación pospuesta al tercer minuto', () => {
    let state = simulationReducer(initialState(), { type: 'postpone', id: 'rec-1' });
    for (let i = 0; i < 2; i++) state = simulationReducer(state, { type: 'tick' });
    expect(state.recommendations[0].status).toBe('postponed');
    state = simulationReducer(state, { type: 'tick' });
    expect(state.recommendations[0].status).toBe('suggested');
  });
  it('mantiene datos válidos durante una sesión larga de cada escenario', () => {
    for (const scenario of SCENARIOS) {
      let state = initialState(scenario);
      for (let tick = 0; tick < 250; tick++) state = simulationReducer(state, { type: 'tick' });
      for (const mode of ['fixed', 'dynamic'] as const) {
        expect(state[mode].buses).toHaveLength(40);
        expect(state[mode].stations.every((s) => s.queue >= 0)).toBe(true);
        expect(
          state[mode].buses.every(
            (b) => b.occupancy >= 0 && b.occupancy <= 100 && b.position >= 0 && b.position < 10,
          ),
        ).toBe(true);
        expect(metrics(state[mode]).wait).toBeGreaterThanOrEqual(0);
        const next = upcomingBuses(state[mode], 5, 'A', state.tick);
        expect(next).toHaveLength(4);
        expect(next.every((b, i) => b.eta > 0 && (i === 0 || b.eta >= next[i - 1].eta))).toBe(true);
      }
    }
  });
});
