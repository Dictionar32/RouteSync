/**
 * semanticNodeHelpers.ts
 *
 * Helpers for unwrapping and extracting semantic nodes and heuristic type inference.
 *
 * @module cli/generators/normalizer
 */

import type { SemanticNode } from './normalizerTypes'

function hasResolved(v: unknown): v is { resolved: SemanticNode } {
  return typeof v === 'object' && v !== null && 'resolved' in v
}

function hasSemantic(v: unknown): v is { semantic: SemanticNode } {
  return typeof v === 'object' && v !== null && 'semantic' in v
}

export function getSemanticNode(v: unknown): SemanticNode | undefined {
  if (!v || typeof v !== 'object') return undefined
  if (hasResolved(v)) return v.resolved
  if (hasSemantic(v)) return v.semantic
  const typed = v as Record<string, unknown>
  if (typed.status || typed.type || typed.kind) {
    return typed as unknown as SemanticNode
  }
  return undefined
}

export function unwrapManifestNode(v: unknown): unknown {
  if (v && typeof v === 'object' && 'node' in v) {
    return (v as { node: unknown }).node
  }
  return v
}

export function inferTypeFromName(name: string): "string" | "number" | "boolean" | "unknown" {
  const lowerName = name.toLowerCase()
  if (
    lowerName.endsWith('minor') ||
    lowerName.endsWith('amount') ||
    lowerName.endsWith('price') ||
    lowerName.endsWith('harga') ||
    lowerName.endsWith('count') ||
    lowerName.endsWith('qty') ||
    lowerName.endsWith('id') ||
    lowerName === 'rating'
  ) {
    return 'number'
  }
  if (
    lowerName.endsWith('url') ||
    lowerName.endsWith('redirect') ||
    lowerName.endsWith('name') ||
    lowerName.endsWith('token') ||
    lowerName.endsWith('number') ||
    lowerName.endsWith('status') ||
    lowerName.endsWith('reason') ||
    lowerName.endsWith('provider') ||
    lowerName.endsWith('code')
  ) {
    return 'string'
  }
  if (
    lowerName.startsWith('is') ||
    lowerName.startsWith('has') ||
    lowerName.startsWith('was') ||
    lowerName.endsWith('paid')
  ) {
    return 'boolean'
  }
  if (
    lowerName.endsWith('at') ||
    lowerName.endsWith('date') ||
    lowerName.endsWith('time')
  ) {
    return 'string'
  }
  return 'unknown'
}
