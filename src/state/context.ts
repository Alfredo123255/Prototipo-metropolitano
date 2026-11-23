import { createContext } from 'react';
import type { Dispatch } from 'react';
import type { Simulation } from '../data/types';
import type { Action } from '../sim/engine';

export interface Toast {
  message: string;
  undoId?: string;
}
export const SimulationContext = createContext<{
  state: Simulation;
  dispatch: Dispatch<Action>;
  toast: Toast | null;
  notify: (message: string, undoId?: string) => void;
} | null>(null);

export function readStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Preferences are optional. */
  }
}
