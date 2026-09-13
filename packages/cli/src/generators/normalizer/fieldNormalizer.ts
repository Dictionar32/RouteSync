/**
 * fieldNormalizer.ts
 *
 * Mapping logic from raw / semantic AST nodes to NormalizedField and NormalizedAccessor.
 * Handles cycle tracking, object recursion, model/resource references, and primitives.
 *
 * @module cli/generators/normalizer
 */

import type {
  NormalizedField,
  NormalizedAccessor,
  RuntimeAugmented
} from './normalizerTypes'
import {
  getSemanticNode,
  inferTypeFromName
} from './semanticNodeHelpers'

export function normalizeAccessor(
  name: string,
  accessorDef: unknown,
  fieldName: string,
  visited: Set<string>
): NormalizedAccessor {
  const augmentedDef = accessorDef as RuntimeAugmented
  const semantic = augmentedDef?.semantic
  let returnType: NormalizedField
  if (semantic && semantic.status === 'resolved') {
    returnType = mapToNormalizedField(accessorDef, fieldName, visited)
  } else {
    const expr = augmentedDef?.expression as { type?: string } | undefined
    if (!expr) {
      const inferred = inferTypeFromName(fieldName)
      returnType = { kind: "primitive", type: inferred === "unknown" ? "string" : inferred, nullable: true }
    } else {
      let primitiveType: "string" | "number" | "boolean" | "null" = "string"
      if (expr.type === 'number') primitiveType = 'number'
      else if (expr.type === 'string') primitiveType = 'string'
      else if (expr.type === 'boolean') primitiveType = 'boolean'

      returnType = { kind: "primitive", type: primitiveType, nullable: true }
    }
  }
  return {
    name,
    returnType
  }
}

export function mapToNormalizedField(
  fieldDef: unknown,
  fieldName: string,
  visited: Set<string>,
  currentPath: string = ''
): NormalizedField {
  if (!fieldDef) {
    const inferred = inferTypeFromName(fieldName)
    return {
      kind: "primitive",
      type: inferred === "unknown" ? "string" : inferred,
      nullable: true
    }
  }

  // Circular reference path tracking
  const path = currentPath ? `${currentPath}.${fieldName}` : fieldName
  if (visited.has(path)) {
    return {
      kind: "primitive",
      type: "string",
      nullable: true
    }
  }

  const nextVisited = new Set(visited)
  nextVisited.add(path)

  const meta = getSemanticNode(fieldDef)
  if (!meta || meta.status === 'unknown' || meta.type === 'unknown') {
    const inferred = inferTypeFromName(fieldName)
    return {
      kind: "primitive",
      type: inferred === "unknown" ? "string" : inferred,
      nullable: true
    }
  }

  const type = meta.type || meta.kind
  const model = meta.model
  const resource = meta.resource
  const collection = !!meta.collection
  const nullable = !!meta.nullable

  if (type === 'model' && model) {
    return {
      kind: "model",
      modelName: model,
      collection,
      paginated: !!meta.paginated,
      nullable
    }
  }

  if (type === 'resource' && resource) {
    return {
      kind: "resource",
      resourceName: resource,
      collection,
      paginated: !!meta.paginated,
      nullable
    }
  }

  if (type === 'object') {
    const fields: Record<string, NormalizedField> = {}
    if (meta.fields) {
      for (const [k, v] of Object.entries(meta.fields)) {
        fields[k] = mapToNormalizedField(v, k, nextVisited, path)
      }
    }
    return {
      kind: "object",
      fields,
      nullable
    }
  }

  let primitiveType: "string" | "number" | "boolean" | "null" = "string"
  if (type === 'number') primitiveType = 'number'
  else if (type === 'string') primitiveType = 'string'
  else if (type === 'boolean') primitiveType = 'boolean'
  else if (type === 'null') primitiveType = 'null'
  else {
    const inferred = inferTypeFromName(fieldName)
    if (inferred !== 'unknown') {
      primitiveType = inferred
    }
  }

  return {
    kind: "primitive",
    type: primitiveType,
    nullable
  }
}
