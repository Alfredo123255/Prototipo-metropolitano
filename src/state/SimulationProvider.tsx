import { useCallback, useEffect, useReducer, useState } from 'react';
import type { ReactNode } from 'react';
import { initialState, simulationReducer, TICK_MS } from '../sim/engine';
import { SimulationContext } from './context';
import type { Toast } from './context';

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(simulationReducer, undefined, () => initialState());
  const [toast, setToast] = useState<Toast | null>(null);
  const notify = useCallback(
    (message: string, undoId?: string) => setToast({ message, undoId }),
    [],
  );
  useEffect(() => {
    if (state.paused) return;
    const interval = window.setInterval(() => dispatch({ type: 'tick' }), TICK_MS / state.speed);
    return () => window.clearInterval(interval);
  }, [state.paused, state.speed]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 6500);
    return () => window.clearTimeout(timeout);
  }, [toast]);
  return (
    <SimulationContext.Provider value={{ state, dispatch, toast, notify }}>
      {children}
    </SimulationContext.Provider>
  );
}
