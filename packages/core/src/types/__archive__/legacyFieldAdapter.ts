/**
 * Phase 1 of the FieldNode migration (see field.ts's header comment).
 * These adapters exist so phase 2 can migrate one call site at a time —
 * wrap old-type output in `fieldFromX()` and the rest of a function can
 * already be written against FieldNode, before every producer of the old
 * type has been touched. Delete this whole file in phase 3, once nothing
 * calls these anymore.
 */

import type { SemanticResolution } from './../contract'
import type { ParsedASTNode } from './../semantic'
import type { ResourceFieldKind, ResponseMetadata } from './../route'
import type { FieldNode } from './../field'

/**
 * `ResourceFieldKind` (route.ts) -> `FieldNode`.
 * `resource` had no equivalent raw FieldNode kind by design (see field.ts —
 * it was never a declared kind, only ever synthesized) — represented here
 * as `unknown` with the resource fact preserved in `resolved`, since an
 * adapter has no original source expression to fall back to.
 */
export function fieldFromResourceFieldKind(old: ResourceFieldKind): FieldNode {
  switch (old.kind) {
    case 'primitive':
      return { kind: 'primitive', type: old.type }
    case 'model':
      return { kind: 'model', model: old.model, collection: old.collection }
    case 'resource':
      return {
        kind: 'unknown',
        resolved: {
          status: 'resolved',
          type: 'resource',
          resource: old.resource,
          collection: old.collection,
          confidence: 100,
          trace: [{ source: 'fieldFromResourceFieldKind', rule: 'legacy adapter', input: old.resource, output: `resource: ${old.resource}` }],
        },
      }
    case 'object': {
      const fields: Record<string, FieldNode> = {}
      for (const key in old.fields) fields[key] = fieldFromResourceFieldKind(old.fields[key])
      return { kind: 'object', fields }
    }
    case 'unknown':
    default:
      return { kind: 'unknown' }
  }
}

/**
 * `ResponseMetadata` (route.ts) -> `FieldNode`.
 * This is the one that had the `& { resolved?, semantic?, collection?,
 * paginated?, type? }` escape hatch — this adapter is where that
 * inconsistency (both `resolved` and `semantic` independently present)
 * gets resolved down to FieldNode's single `resolved`. `semantic` wins if
 * both are present and disagree, since it was the one SemanticKernelV2
 * actually wrote most recently in the old pipeline.
 */
export function fieldFromResponseMetadata(old: ResponseMetadata): FieldNode {
  const resolved = (old.semantic ?? old.resolved) as SemanticResolution | undefined
  const base: FieldNode = (() => {
    switch (old.kind) {
      case 'model':
        return { kind: 'model', model: old.model, collection: old.collection, paginated: old.paginated }
      case 'resource':
        return {
          kind: 'unknown',
          resolved: {
            status: 'resolved',
            type: 'resource',
            resource: old.resource,
            collection: old.collection,
            confidence: 100,
            trace: [{ source: 'fieldFromResponseMetadata', rule: 'legacy adapter', input: old.resource, output: `resource: ${old.resource}` }],
          },
        }
      case 'object': {
        const fields: Record<string, FieldNode> = {}
        for (const key in old.fields) {
          const v = old.fields[key]
          fields[key] = 'kind' in v && v.kind === 'primitive' ? { kind: 'primitive', type: v.type } : fieldFromResponseMetadata(v as ResponseMetadata)
        }
        return { kind: 'object', fields }
      }
      case 'unknown':
      default:
        return { kind: 'unknown' }
    }
  })()
  return resolved ? { ...base, resolved } : base
}

/**
 * `ParsedASTNode` (semantic.ts) -> `FieldNode`.
 * Framework-specific fields (`resource`, `collection` on MethodCallAST /
 * ResourceAST / NewInstanceAST, and the forced `model` target on static
 * calls) are dropped here on purpose — see field.ts's header. If the old
 * AST had already inferred `resource`, that fact is preserved as
 * `resolved` rather than as a raw kind, matching the new design.
 */
export function fieldFromParsedASTNode(ast: ParsedASTNode, originalCode = ''): FieldNode {
  const oc = originalCode || (ast as { code?: string }).code || ''
  switch (ast.kind) {
    case 'literal':
      return { kind: 'literal', originalCode: oc, value: ast.value }
    case 'variable':
      return { kind: 'variable', originalCode: oc, name: ast.name }
    case 'property_access':
      return {
        kind: 'property_access',
        originalCode: oc,
        target: ast.target ? fieldFromParsedASTNode(ast.target) : null,
        property: ast.property,
        // old PropertyAccessAST type never declared this even though the
        // real parser has set it since the JSON-member-access work — see
        // PhpCodeParser.ts's offsetlookup/propertylookup handling.
        accessKind: (ast as unknown as { accessKind?: 'array_access' | 'property_access' | 'optional_access' }).accessKind || 'property_access',
      }
    case 'nullsafe_property_access':
      return { kind: 'nullsafe_property_access', originalCode: oc, target: ast.target ? fieldFromParsedASTNode(ast.target) : null, property: ast.property }
    case 'method_call':
      return {
        kind: 'method_call',
        originalCode: oc,
        target: ast.target ? fieldFromParsedASTNode(ast.target) : null,
        name: ast.name,
        args: ast.args.map((a) => fieldFromParsedASTNode(a)),
      }
    case 'static_method_call':
      // old shape forced target to ModelAST; className falls back to '' if
      // some other node ever ended up there (shouldn't happen in practice)
      return {
        kind: 'static_method_call',
        originalCode: oc,
        className: ast.target && ast.target.kind === 'model' ? ast.target.model : '',
        name: ast.name,
        args: [],
      }
    case 'binary_expression':
      return { kind: 'binary_expression', originalCode: oc, operator: ast.operator, left: fieldFromParsedASTNode(ast.left), right: fieldFromParsedASTNode(ast.right) }
    case 'type_cast':
      return { kind: 'type_cast', originalCode: oc, castType: ast.castType, expression: fieldFromParsedASTNode(ast.expression) }
    case 'ternary':
      return { kind: 'ternary', originalCode: oc, condition: fieldFromParsedASTNode(ast.condition), truthy: fieldFromParsedASTNode(ast.truthy), falsy: fieldFromParsedASTNode(ast.falsy) }
    case 'nullsafe_chain':
      return { kind: 'nullsafe_chain', originalCode: oc, chain: ast.chain.map((n) => fieldFromParsedASTNode(n)) }
    case 'new_instance':
      return {
        kind: 'new_instance',
        originalCode: oc,
        className: ast.target && ast.target.kind === 'model' ? ast.target.model : (ast.resource ?? ''),
        args: [],
        // constructor args weren't captured by the old AST at all (see
        // field.ts point 4) — nothing to map here, phase 2 needs to add
        // arg-capture to PhpCodeParser itself, not just to this adapter.
      }
    case 'resource':
      return {
        kind: 'unknown',
        resolved: {
          status: 'resolved',
          type: 'resource',
          resource: ast.resource,
          collection: ast.collection,
          confidence: 100,
          trace: [{ source: 'fieldFromParsedASTNode', rule: 'legacy adapter', input: ast.resource, output: `resource: ${ast.resource}` }],
        },
      }
    case 'model':
      return { kind: 'model', model: ast.model, collection: false }
    case 'primitive':
      return { kind: 'primitive', type: ast.type }
    case 'unknown':
    default:
      return { kind: 'unknown' }
  }
}
