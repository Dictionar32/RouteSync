/**
 * pathClassifier.ts
 *
 * Deterministic path classification and CRUD role inference.
 * Path-driven grouping and role assignment with zero heuristics.
 *
 * @module cli/generators/classifier
 */

import {
  CrudRole,
  CRUD_ROLE_REGISTRY,
  matchHttpMethod
} from '@routesync/core'
import { toIdentifier } from '../names'

export function isDynamic(segment: string): boolean {
  return segment.startsWith('{') || segment.startsWith(':')
}

export function toRuntimePath(path: string): string {
  return path.replace(/\{([^}/]+)\}/g, ':$1')
}

/**
 * Derive the group name from the URL path.
 *
 * Algorithm:
 *   Walk path segments left-to-right.
 *   Static segments accumulate into a "bucket".
 *   Dynamic segments flush the current bucket and reset it
 *     (the param is a boundary — what comes after is a sub-resource).
 *   All flushed buckets are joined with spaces and camelCased.
 *
 * Trailing dynamic segments are ignored (they don't start a new sub-resource).
 */
export function deriveGroupName(path: string): string {
  const segments = path.split('/').filter(Boolean);

  const parts: string[] = []
  let current: string[] = []

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (isDynamic(seg)) {
      // Is there any static segment after this param?
      const hasStaticAfter = segments.slice(i + 1).some(s => !isDynamic(s))
      if (hasStaticAfter) {
        // Non-trailing param: flush current bucket as completed sub-resource
        if (current.length > 0) {
          parts.push(current.join('_'))
          current = []
        }
      }
      // Trailing param: just skip — it belongs to the current resource
    } else {
      current.push(seg)
    }
  }

  // Flush remaining
  if (current.length > 0) parts.push(current.join('_'))

  return toIdentifier(parts.join(' '))
}

/**
 * Classify the CRUD role using only HTTP method + trailing-param flag.
 * No path string inspection, no model lookup.
 */
export function classifyCrudRole(method: string, hasTrailingParam: boolean, paramCount: number): CrudRole {
  return matchHttpMethod(method, {
    GET: () => {
      if (hasTrailingParam && paramCount === 1) return CrudRole.Show
      if (!hasTrailingParam && paramCount === 0) return CrudRole.Index
      return CrudRole.Custom
    },
    POST: () => (!hasTrailingParam && paramCount === 0) ? CrudRole.Create : CrudRole.Custom,
    PUT: () => (hasTrailingParam && paramCount === 1) ? CrudRole.Update : CrudRole.Custom,
    PATCH: () => (hasTrailingParam && paramCount === 1) ? CrudRole.Update : CrudRole.Custom,
    DELETE: () => (hasTrailingParam && paramCount === 1) ? CrudRole.Delete : CrudRole.Custom,
    OPTIONS: () => CrudRole.Custom,
    HEAD: () => CrudRole.Custom
  })
}

/**
 * Canonical base action name for a CRUD role (SSOT derived from CRUD_ROLE_REGISTRY).
 */
export const ROLE_ACTION: Record<CrudRole, string> = Object.freeze(
  Object.fromEntries(
    Object.values(CRUD_ROLE_REGISTRY).map(spec => [spec.role, spec.defaultActionName])
  ) as Record<CrudRole, string>
)
