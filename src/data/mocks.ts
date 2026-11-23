import { es } from '../i18n/es';
import type { Bus, RouteId, ScenarioId, World, Recommendation } from './types';

export const ROUTES: RouteId[] = ['A', 'B', 'C', 'Expreso 1'];
export const SCENARIOS: ScenarioId[] = ['morning', 'evening', 'valley', 'event'];
export const PROFILES: Record<ScenarioId, { queues: number[]; start: number; peak: number }> = {
  morning: { queues: [102, 63, 91, 44, 128, 268, 66, 187, 38, 72], start: 450, peak: 5 },
  evening: { queues: [62, 38, 71, 42, 98, 236, 193, 166, 82, 108], start: 1080, peak: 6 },
  valley: { queues: [26, 12, 24, 18, 38, 68, 32, 42, 18, 36], start: 780, peak: 5 },
  event: { queues: [66, 28, 75, 164, 312, 218, 86, 118, 45, 62], start: 1170, peak: 4 },
};

export function createWorld(scenario: ScenarioId, fixed = false): World {
  const profile = PROFILES[scenario];
  const stations = es.stationNames.map((name, id) => ({
    id,
    name,
    queue: Math.round(profile.queues[id] * (fixed ? 1.35 : 1)),
    forecast: [0.72, 0.9, 1.13, 1.02, 0.86, 0.69].map((n) =>
      Math.round(profile.queues[id] * n * 0.48),
    ),
  }));
  const buses: Bus[] = Array.from({ length: 40 }, (_, i) => ({
    id: `MT-${String(i + 101).padStart(3, '0')}`,
    route: ROUTES[Math.floor(i / 10)],
    position: (i * 2.37 + 0.8) % 10,
    capacity: 160,
    occupancy: Math.min(99, 32 + ((i * 17 + 13) % 65) + (fixed ? 9 : 0)),
    state: 'service',
  }));
  return { stations, buses };
}

export function createRecommendations(scenario: ScenarioId): Recommendation[] {
  const peak = PROFILES[scenario].peak;
  return [
    {
      id: 'rec-1',
      station: peak,
      from: 'B',
      to: 'Expreso 1',
      count: 2,
      eta: 3,
      status: 'suggested',
    },
    {
      id: 'rec-2',
      station: scenario === 'morning' ? 7 : 5,
      from: 'A',
      to: 'C',
      count: 1,
      eta: 4,
      status: 'suggested',
    },
    { id: 'rec-3', station: 0, from: 'C', to: 'A', count: 3, eta: 5, status: 'suggested' },
  ];
}
