import { createRecommendations, createWorld, PROFILES } from '../data/mocks';
import type { Level, Mode, Recommendation, ScenarioId, Simulation, World } from '../data/types';

export const TICK_MS = 6000;
export function random(seed: number): number {
  let x = seed | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 4294967296;
}
export function level(queue: number): Level {
  return queue >= 180 ? 'saturated' : queue >= 90 ? 'growing' : 'fluid';
}
export function formatTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
export function simTime(state: Simulation): string {
  return formatTime(PROFILES[state.scenario].start + state.tick);
}
export function initialState(scenario: ScenarioId = 'morning'): Simulation {
  const dynamic = createWorld(scenario);
  const fixed = createWorld(scenario, true);
  return {
    scenario,
    tick: 0,
    paused: false,
    speed: 1,
    mode: 'dynamic',
    dynamic,
    fixed,
    recommendations: createRecommendations(scenario),
    decisions: [],
    updatedAt: Date.now(),
    samples: { dynamic: [metrics(dynamic)], fixed: [metrics(fixed)] },
  };
}
export function routeGap(world: World, route: string, removing = 0): number {
  const count =
    world.buses.filter((bus) => bus.route === route && bus.state === 'service').length - removing;
  return count <= 0 ? 99 : Math.ceil(46 / count);
}
export function metrics(world: World) {
  const mean =
    world.stations.reduce((sum, station) => sum + station.queue, 0) / world.stations.length;
  return {
    wait: +(mean / 15 + 0.8).toFixed(1),
    full: Math.round(
      (world.buses.filter((bus) => bus.occupancy > 90).length / world.buses.length) * 100,
    ),
    saturated: world.stations.filter((station) => level(station.queue) === 'saturated').length,
    gaps: ['A', 'B', 'C', 'Expreso 1'].filter((route) => routeGap(world, route) > 6).length,
  };
}
function tickWorld(world: World, scenario: ScenarioId, tick: number, dynamic: boolean): World {
  const buses = world.buses.map((bus) => {
    if (
      bus.state === 'reinforcement' &&
      bus.arrivalTick !== undefined &&
      bus.target !== undefined
    ) {
      if (tick < bus.arrivalTick)
        return {
          ...bus,
          position:
            bus.position + (bus.target - bus.position) / Math.max(1, bus.arrivalTick - tick + 1),
        };
      return {
        ...bus,
        state: 'service' as const,
        position: bus.target,
        occupancy: 68,
        target: undefined,
        arrivalTick: undefined,
      };
    }
    return {
      ...bus,
      position: (bus.position + 0.23) % 10,
      occupancy: Math.max(
        10,
        Math.min(
          99,
          bus.occupancy + Math.round(random(tick * 811 + Number(bus.id.slice(3)) * 31) * 12 - 6),
        ),
      ),
    };
  });
  const stations = world.stations.map((station) => {
    const demand = PROFILES[scenario].queues[station.id];
    const arrivals = Math.round(demand * 0.055 + random(tick * 5743 + station.id * 173 + 42) * 8);
    const boarding = Math.round(demand * (dynamic ? 0.055 : 0.035) + (dynamic ? 6 : 3));
    const reinforcements = world.buses.filter(
      (bus) => bus.target === station.id && bus.arrivalTick === tick,
    );
    const boarded = reinforcements.reduce(
      (sum, bus) => sum + Math.round(bus.capacity * (1 - bus.occupancy / 100)),
      0,
    );
    // The additional capacity persists after arrival; a fixed timetable receives no such capacity.
    const queue = Math.max(0, station.queue + arrivals - boarding - boarded);
    return { ...station, queue };
  });
  return { stations, buses };
}
export type Action =
  | { type: 'tick' }
  | { type: 'pause' }
  | { type: 'speed'; speed: 1 | 5 | 10 }
  | { type: 'scenario'; scenario: ScenarioId }
  | { type: 'mode'; mode: Mode }
  | { type: 'reset' }
  | { type: 'accept' | 'dismiss' | 'postpone' | 'undo'; id: string; force?: boolean };

export function simulationReducer(state: Simulation, action: Action): Simulation {
  switch (action.type) {
    case 'pause':
      return { ...state, paused: !state.paused };
    case 'speed':
      return { ...state, speed: action.speed };
    case 'mode':
      return { ...state, mode: action.mode };
    case 'scenario':
      return {
        ...initialState(action.scenario),
        paused: state.paused,
        speed: state.speed,
        mode: state.mode,
      };
    case 'reset':
      return {
        ...initialState(state.scenario),
        paused: state.paused,
        speed: state.speed,
        mode: state.mode,
      };
    case 'tick': {
      const tick = state.tick + 1;
      const dynamic = tickWorld(state.dynamic, state.scenario, tick, true);
      const fixed = tickWorld(state.fixed, state.scenario, tick, false);
      const arrived = state.recommendations.filter(
        (r) =>
          r.status === 'accepted' &&
          r.acceptedTick !== undefined &&
          tick === r.acceptedTick + r.eta + r.count - 1,
      );
      const recommendations = state.recommendations.map((r): Recommendation => {
        if (arrived.some((a) => a.id === r.id)) return { ...r, status: 'completed' };
        if (r.status === 'postponed' && tick >= (r.returnTick ?? 0))
          return { ...r, status: 'suggested' };
        return r;
      });
      const decisions = [
        ...arrived.map((r, i) => ({
          id: state.decisions.length + i + 1,
          tick,
          action: 'arrived' as const,
          recommendationId: r.id,
          station: r.station,
          busIds: r.busIds ?? [],
        })),
        ...state.decisions,
      ];
      return {
        ...state,
        tick,
        dynamic,
        fixed,
        recommendations,
        decisions,
        updatedAt: Date.now(),
        samples: {
          dynamic: [...state.samples.dynamic, metrics(dynamic)].slice(-20),
          fixed: [...state.samples.fixed, metrics(fixed)].slice(-20),
        },
      };
    }
    default: {
      const recommendation = state.recommendations.find((r) => r.id === action.id);
      if (!recommendation) return state;
      let dynamic = state.dynamic;
      let updated: Recommendation;
      if (action.type === 'accept') {
        if (state.mode !== 'dynamic' || recommendation.status !== 'suggested') return state;
        const available = state.dynamic.buses.filter(
          (bus) => bus.route === recommendation.from && bus.state === 'service',
        );
        if (
          available.length < recommendation.count ||
          (!action.force && routeGap(state.dynamic, recommendation.from, recommendation.count) > 6)
        )
          return state;
        const chosen = available.slice(0, recommendation.count);
        const busIds = chosen.map((bus) => bus.id);
        dynamic = {
          ...dynamic,
          buses: dynamic.buses.map((bus) => {
            const index = busIds.indexOf(bus.id);
            return index < 0
              ? bus
              : {
                  ...bus,
                  route: recommendation.to,
                  state: 'reinforcement',
                  occupancy: 18,
                  target: recommendation.station,
                  arrivalTick: state.tick + recommendation.eta + index,
                };
          }),
        };
        updated = {
          ...recommendation,
          status: 'accepted',
          acceptedTick: state.tick,
          busIds,
          originalBuses: chosen.map((b) => ({ ...b })),
        };
      } else if (action.type === 'undo') {
        if (
          recommendation.status !== 'accepted' ||
          recommendation.acceptedTick === undefined ||
          state.tick >= recommendation.acceptedTick + recommendation.eta
        )
          return state;
        dynamic = {
          ...dynamic,
          buses: dynamic.buses.map(
            (bus) =>
              recommendation.originalBuses?.find((original) => original.id === bus.id) ?? bus,
          ),
        };
        updated = {
          ...recommendation,
          status: 'suggested',
          busIds: [],
          originalBuses: undefined,
          acceptedTick: undefined,
        };
      } else {
        if (recommendation.status !== 'suggested') return state;
        updated = {
          ...recommendation,
          status: action.type === 'dismiss' ? 'dismissed' : 'postponed',
          returnTick: state.tick + 3,
        };
      }
      const logActions = {
        accept: 'accepted',
        dismiss: 'dismissed',
        postpone: 'postponed',
        undo: 'undone',
      } as const;
      return {
        ...state,
        dynamic,
        recommendations: state.recommendations.map((r) => (r.id === updated.id ? updated : r)),
        decisions: [
          {
            id: state.decisions.length + 1,
            tick: state.tick,
            action: logActions[action.type],
            recommendationId: updated.id,
            station: updated.station,
            busIds: updated.busIds ?? [],
          },
          ...state.decisions,
        ],
      };
    }
  }
}

export function upcomingBuses(world: World, stationId: number, route: string, tick: number) {
  return world.buses
    .filter((bus) => bus.route === route)
    .map((bus) => {
      const distance = (stationId - bus.position + 10) % 10;
      const eta =
        bus.target === stationId && bus.arrivalTick !== undefined
          ? Math.max(1, bus.arrivalTick - tick)
          : Math.max(1, Math.ceil(distance / 0.23));
      return { ...bus, eta };
    })
    .sort((a, b) => a.eta - b.eta || a.id.localeCompare(b.id))
    .slice(0, 4);
}
