/**
 * Semantic vocabulary compatibility surface.
 *
 * Canonical names/value objects live in ../upstream. This module may expose
 * semantic-only atoms, but must not redefine canonical names or provenance.
 */
import type {
  ModelName,
  ControllerName,
} from '../upstream/names';
import type { NumberValue } from '../upstream/valueObjects';

export type ModelNodeName = ModelName;
export type ControllerNodeName = ControllerName;
export type SourceLineNumber = NumberValue;
export type SourceColumnNumber = NumberValue;

/** Service is not yet represented by a canonical upstream name. */
export interface ServiceNodeName {
  readonly kind: 'service_node_name';
  readonly value: import('../upstream/valueObjects').StringValue;
}

/**
 * Confidence remains a semantic scalar because no upstream confidence
 * contract exists. Transport response confidence has its own richer model.
 */
export type ConfidenceScore = number & { readonly __confidenceScore: unique symbol };

const stringValue = (value: string) =>
  Object.freeze({ kind: 'string_value' as const, value });

export function createSourceColumnNumber(col: number): SourceColumnNumber {
  return Object.freeze({ kind: 'number_value' as const, value: Math.max(0, Math.floor(col)) });
}

export function createModelNodeName(name: string): ModelNodeName {
  return Object.freeze({ kind: 'model_name' as const, value: stringValue(name.trim()) });
}

export function createServiceNodeName(name: string): ServiceNodeName {
  return Object.freeze({ kind: 'service_node_name' as const, value: stringValue(name.trim()) });
}

export function createControllerNodeName(name: string): ControllerNodeName {
  return Object.freeze({ kind: 'controller_name' as const, value: stringValue(name.trim()) });
}

export function createConfidenceScore(score: number): ConfidenceScore {
  return Math.min(1, Math.max(0, score)) as ConfidenceScore;
}
