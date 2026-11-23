import { useContext } from 'react';
import { SimulationContext } from './context';

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) throw new Error('SimulationProvider is required');
  return context;
}
