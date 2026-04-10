import type { PlanStrategy } from '~/stores/plan';

export interface StrategyMeta {
  id: PlanStrategy;
  name: string;
  description: string;
  color: 'blue' | 'green' | 'purple' | 'red' | 'orange';
}

export function useStrategies(): StrategyMeta[] {
  return [
    {
      id: 'avalanche',
      name: 'Avalancha',
      description: 'Paga primero la deuda con mayor tasa de interés. Ahorra más dinero a largo plazo.',
      color: 'blue',
    },
    {
      id: 'snowball',
      name: 'Bola de Nieve',
      description: 'Paga primero la deuda más pequeña. Gana victorias rápidas y motivación.',
      color: 'green',
    },
    {
      id: 'hybrid',
      name: 'Híbrida',
      description: 'Combina ahorro de interés con motivación psicológica.',
      color: 'purple',
    },
    {
      id: 'crisis_first',
      name: 'Crisis Primero',
      description: 'Ataca primero las deudas que crecen más rápido que tus pagos.',
      color: 'red',
    },
    {
      id: 'guided_consolidation',
      name: 'Consolidación Guiada',
      description: 'Enfoque equilibrado recomendado por asesores financieros.',
      color: 'orange',
    },
  ];
}
