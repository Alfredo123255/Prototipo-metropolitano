export type ScenarioId = 'morning' | 'evening' | 'valley' | 'event';
export type RouteId = 'A' | 'B' | 'C' | 'Expreso 1';
export type Level = 'fluid' | 'growing' | 'saturated';
export type Mode = 'dynamic' | 'fixed';
export interface Station {
  id: number;
  name: string;
  queue: number;
  forecast: number[];
}
export interface Bus {
  id: string;
  route: RouteId;
  position: number;
  capacity: number;
  occupancy: number;
  state: 'service' | 'reinforcement';
  target?: number;
  arrivalTick?: number;
}
export interface World {
  stations: Station[];
  buses: Bus[];
}
export interface Recommendation {
  id: string;
  station: number;
  from: RouteId;
  to: RouteId;
  count: number;
  eta: number;
  status: 'suggested' | 'accepted' | 'dismissed' | 'postponed' | 'completed' | 'undone';
  returnTick?: number;
  acceptedTick?: number;
  busIds?: string[];
  originalBuses?: Bus[];
}
export interface Decision {
  id: number;
  tick: number;
  action: 'accepted' | 'dismissed' | 'postponed' | 'undone' | 'arrived';
  recommendationId: string;
  station: number;
  busIds: string[];
}
export interface Metrics {
  wait: number;
  full: number;
  saturated: number;
  gaps: number;
}
export interface Simulation {
  scenario: ScenarioId;
  tick: number;
  paused: boolean;
  speed: 1 | 5 | 10;
  mode: Mode;
  dynamic: World;
  fixed: World;
  recommendations: Recommendation[];
  decisions: Decision[];
  updatedAt: number;
  samples: Record<Mode, Metrics[]>;
}
