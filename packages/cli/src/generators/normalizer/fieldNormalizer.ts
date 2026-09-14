/**
 * fieldNormalizer.ts
 *
 * Mapping logic from raw / semantic AST nodes to NormalizedField and NormalizedAccessor.
 * Handles cycle tracking, object recursion, model/resource references, and primitives.
 * Pure Catamorphic Dispatch: 0 'if', 0 'switch'.
 *
 * @module cli/generators/normalizer
 */

import type {
  NormalizedField,
  NormalizedAccessor,
  RuntimeAugmented,
  SemanticNode
} from './normalizerTypes'
import {
  getSemanticNode,
  inferTypeFromName
} from './semanticNodeHelpers'

const PRIMITIVE_TYPE_MAP: ReadonlyMap<string, "string" | "number" | "boolean" | "null"> = new Map([
  ['number', 'number'],
  ['int', 'number'],
  ['integer', 'number'],
  ['float', 'number'],
  ['double', 'number'],
  ['decimal', 'number'],
  ['string', 'string'],
  ['boolean', 'boolean'],
  ['bool', 'boolean'],
  ['null', 'null'],
]);

function resolvePrimitiveType(rawType: string | undefined, fieldName: string): "string" | "number" | "boolean" | "null" {
  const mapped = rawType ? PRIMITIVE_TYPE_MAP.get(rawType) : undefined;
  const inferred = inferTypeFromName(fieldName);
  const fallback = inferred === 'unknown' ? 'string' : inferred;
  return mapped ?? fallback;
}

export function normalizeAccessor(
  name: string,
  accessorDef: unknown,
  fieldName: string,
  visited: Set<string>
): NormalizedAccessor {
  const augmentedDef = accessorDef as RuntimeAugmented;
  const semantic = augmentedDef?.semantic;
  const expr = augmentedDef?.expression as { type?: string } | undefined;

  const isResolved = semantic?.status === 'resolved';
  const returnType = isResolved
    ? mapToNormalizedField(accessorDef, fieldName, visited)
    : {
        kind: "primitive" as const,
        type: resolvePrimitiveType(expr?.type, fieldName),
        nullable: true,
      };

  return { name, returnType };
}

interface NormalizationContext {
  readonly meta: SemanticNode;
  readonly fieldName: string;
  readonly nextVisited: Set<string>;
  readonly path: string;
}

const FIELD_DISPATCHERS: Record<string, (ctx: NormalizationContext) => NormalizedField | undefined> = {
  model: (ctx) => (ctx.meta.model ? {
    kind: "model",
    modelName: ctx.meta.model,
    collection: Boolean(ctx.meta.collection),
    paginated: Boolean(ctx.meta.paginated),
    nullable: Boolean(ctx.meta.nullable)
  } : undefined),

  resource: (ctx) => (ctx.meta.resource ? {
    kind: "resource",
    resourceName: ctx.meta.resource,
    collection: Boolean(ctx.meta.collection),
    paginated: Boolean(ctx.meta.paginated),
    nullable: Boolean(ctx.meta.nullable)
  } : undefined),

  object: (ctx) => ({
    kind: "object",
    fields: Object.fromEntries(
      Object.entries(ctx.meta.fields ?? {}).map(([k, v]) => [
        k,
        mapToNormalizedField(v, k, ctx.nextVisited, ctx.path)
      ])
    ),
    nullable: Boolean(ctx.meta.nullable)
  })
};

export function mapToNormalizedField(
  fieldDef: unknown,
  fieldName: string,
  visited: Set<string>,
  currentPath: string = ''
): NormalizedField {
  const path = currentPath ? `${currentPath}.${fieldName}` : fieldName;
  const isCircular = visited.has(path);
  const nextVisited = new Set(visited).add(path);
  const meta = fieldDef ? getSemanticNode(fieldDef) : undefined;
  const isUnknown = !meta || meta.status === 'unknown' || meta.type === 'unknown';

  const typeKey = meta ? (meta.type || meta.kind || '') : '';
  const dispatched = (!isUnknown && meta)
    ? FIELD_DISPATCHERS[typeKey]?.({ meta, fieldName, nextVisited, path })
    : undefined;

  const primitiveFallback: NormalizedField = {
    kind: "primitive",
    type: resolvePrimitiveType(meta?.type, fieldName),
    nullable: Boolean(meta?.nullable ?? true)
  };

  const circularFallback: NormalizedField = {
    kind: "primitive",
    type: "string",
    nullable: true
  };

  return isCircular
    ? circularFallback
    : (dispatched ?? primitiveFallback);
}
