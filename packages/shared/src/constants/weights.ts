import type { RubricDimension } from '../types/rubric';

// Default weights by agent type
export interface AgentTypeWeights {
  accuracy: number;
  stability: number;
  cost: number;
  latency: number;
  security: number;
}

export const DEFAULT_WEIGHTS: AgentTypeWeights = {
  accuracy: 0.40,
  stability: 0.20,
  cost: 0.15,
  latency: 0.10,
  security: 0.15,
};

export const AGENT_TYPE_WEIGHTS: Record<string, AgentTypeWeights> = {
  customer_service: {
    accuracy: 0.35,
    stability: 0.25,
    cost: 0.15,
    latency: 0.15,
    security: 0.10,
  },
  medical_finance: {
    accuracy: 0.35,
    stability: 0.20,
    cost: 0.10,
    latency: 0.10,
    security: 0.25,
  },
  code_agent: {
    accuracy: 0.45,
    stability: 0.15,
    cost: 0.10,
    latency: 0.15,
    security: 0.15,
  },
  office_automation: {
    accuracy: 0.40,
    stability: 0.25,
    cost: 0.15,
    latency: 0.10,
    security: 0.10,
  },
  content_creation: {
    accuracy: 0.40,
    stability: 0.15,
    cost: 0.20,
    latency: 0.10,
    security: 0.15,
  },
};

export function applyWeights(dimensions: RubricDimension[], weights: AgentTypeWeights): RubricDimension[] {
  return dimensions.map((dim) => ({
    ...dim,
    weight: weights[dim.key as keyof AgentTypeWeights] ?? dim.weight,
  }));
}
