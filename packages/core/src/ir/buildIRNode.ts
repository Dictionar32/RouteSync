import { createHash } from 'crypto'
import type { SemanticIRNode, SourceRef, IRRawNode, SemanticNode, IRContext, ParsedASTNode } from '../types/semantic'
import { isObject, hasProperty, isString } from '../utils/type-guards'

/**
 * Roadmap Stage 2 (IR v3) — see compiler/CompilerRoadmap.md.
 *
 * Today `SemanticIRNode` is only ever constructed transiently, with
 * `meta.stableHash: ""` and `meta.lineage: []` hardcoded
 * (`packages/sdk/src/generator.ts:121`), and that construction site is on a
 * dead code path (backlog H4) — it never runs during `scan`/`generate`.
 *
 * This module is the real construction site: every field resolved by
 * `resolveManifestIncrementally` (packages/cli/src/utils/incremental.ts) gets
 * one of these, with `id`/`source`/`meta.stableHash`/`meta.lineage` actually
 * computed from real inputs, not left empty.
 *
 * Deliberately additive: this does not change what `field.resolved` contains
 * (existing generators keep reading that flat shape unchanged). The IR node
 * built here is a second, addressable artifact — see
 * `packages/cli/src/utils/incremental.ts`'s `irRegistry` and
 * `routesync.ir.json` — which is what "computed once, so stages 3-6 have
 * something stable to key off" (CompilerRoadmap.md Stage 2) actually requires.
 */

/**
 * `stableHash` is a hash of exactly the inputs that determine the resolution
 * outcome: the raw code being resolved plus the semantic result derived from
 * it. It deliberately excludes `id`/`source`/lineage so that moving a field
 * to a different line, or renaming its parent, does not change its hash —
 * only a change to the code or to what it resolves to should invalidate it.
 * This is the same property `ZeroBoilerplate.md` §6 asks for.
 */
export function computeStableHash(rawCode: string, semantic: SemanticNode): string {
  const canonical = JSON.stringify({
    code: rawCode,
    type: semantic.type,
    status: semantic.status,
    model: semantic.model ?? null,
    resource: semantic.resource ?? null,
    collection: !!semantic.collection,
  })
  return createHash('sha256').update(canonical).digest('hex')
}

export interface BuildIRNodeInput {
  /** Deterministic, human-readable path — e.g. `route:GET:/orders/{id}#response.items.0.price` */
  id: string
  source: SourceRef
  rawCode: string
  parsedAst?: unknown
  hints?: IRRawNode['hints']
  semantic: SemanticNode
  /** ids of ancestor nodes, root-first, not including this node's own id */
  lineage: string[]
  context?: IRContext
}

/**
 * Type guard untuk ParsedASTNode
 */
function isParsedASTNode(value: unknown): value is ParsedASTNode {
  return isObject(value) &&
    hasProperty(value, 'kind') &&
    isString(value.kind) &&
    ['property_access', 'method_call', 'binary_expression', 'type_cast',
      'ternary', 'literal', 'nullsafe_chain', 'unknown', 'variable',
      'primitive', 'resource', 'model', 'static_method_call',
      'nullsafe_property_access', 'new_instance'].includes(value.kind)
}

export function buildSemanticIRNode(input: BuildIRNodeInput): SemanticIRNode {
  const node: IRRawNode = {
    kind: 'raw_code',
    code: input.rawCode,
    hints: input.hints,
    parsed_ast: isParsedASTNode(input.parsedAst) ? input.parsedAst : undefined,
  }

  return {
    id: input.id,
    source: input.source,
    node,
    semantic: input.semantic,
    meta: {
      version: 'ir.v2',
      stableHash: computeStableHash(input.rawCode, input.semantic),
      lineage: input.lineage,
      createdAt: new Date().toISOString(),
    },
    context: input.context,
  }
}

/** In-memory registry keyed by `SemanticIRNode.id`, built once per scan and serialized as-is. */
export class IRNodeRegistry {
  private nodes = new Map<string, SemanticIRNode>()

  add(node: SemanticIRNode): SemanticIRNode {
    this.nodes.set(node.id, node)
    return node
  }

  get(id: string): SemanticIRNode | undefined {
    return this.nodes.get(id)
  }

  toJSON(): Record<string, SemanticIRNode> {
    return Object.fromEntries(this.nodes)
  }

  get size(): number {
    return this.nodes.size
  }
}
