/**
 * nominalVocabulary.ts
 *
 * Branded nominal type atoms for the semantic domain.
 * Eliminates unbranded strings and naked numbers at origin boundary.
 *
 * @module core/types/semantic
 */

export type SourceLineNumber = number & { readonly __brand: unique symbol }
export type SourceColumnNumber = number & { readonly __brand: unique symbol }
export type ModelNodeName = string & { readonly __brand: unique symbol }
export type ServiceNodeName = string & { readonly __brand: unique symbol }
export type ControllerNodeName = string & { readonly __brand: unique symbol }
export type ConfidenceScore = number & { readonly __brand: unique symbol }

export function createSourceLineNumber(line: number): SourceLineNumber {
  return Math.max(1, Math.floor(line)) as SourceLineNumber
}

export function createSourceColumnNumber(col: number): SourceColumnNumber {
  return (col >= 0 ? Math.floor(col) : 0) as SourceColumnNumber
}

export function createModelNodeName(name: string): ModelNodeName {
  return name.trim() as ModelNodeName
}

export function createServiceNodeName(name: string): ServiceNodeName {
  return name.trim() as ServiceNodeName
}

export function createControllerNodeName(name: string): ControllerNodeName {
  return name.trim() as ControllerNodeName
}

export function createConfidenceScore(score: number): ConfidenceScore {
  return Math.min(1.0, Math.max(0.0, score)) as ConfidenceScore
}
