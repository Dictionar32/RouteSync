/**
 * Canonical source-boundary projection algebra.
 *
 * This is a representation-only projection from the already classified,
 * closed AST ADT to its tagged boundary view. It must not infer Laravel
 * semantics, inspect source text, or create a second source authority.
 */
import type { CanonicalSourceNode, SourceBoundaryInput } from './sourceBoundary';

export type SourceBoundaryKind = SourceBoundaryInput['kind'];

/** Project one canonical AST node to its matching closed boundary variant. */
export const sourceBoundaryInputFromCanonicalNode = (
  node: CanonicalSourceNode,
): SourceBoundaryInput => {
  switch (node.kind) {
    case 'model_ast':
      return { kind: 'model_source', node: node };
    case 'resource_ast':
      return { kind: 'resource_source', node: node };
    case 'request_ast':
      return { kind: 'request_source', node: node };
    case 'route_ast':
      return { kind: 'route_source', node: node };
    case 'controller_ast':
      return { kind: 'controller_source', node: node };
    case 'response_ast':
      return { kind: 'response_source', node: node };
    case 'service_ast':
      return { kind: 'service_source', node: node };
    case 'migration_ast':
      return { kind: 'migration_source', node: node };
    case 'dto_ast':
      return { kind: 'dto_source', node: node };
    case 'middleware_ast':
      return { kind: 'middleware_source', node: node };
    case 'provider_ast':
      return { kind: 'provider_source', node: node };
    case 'attribute_ast':
      return { kind: 'attribute_source', node: node };
    case 'channel_ast':
      return { kind: 'channel_source', node: node };
    default: {
      const exhaustive: never = node;
      return exhaustive;
    }
  }
};

/** Preserve source identity: this algebra wraps the exact AST node, not a copy. */
export const sourceBoundaryNodeOf = (input: SourceBoundaryInput): CanonicalSourceNode => input.node;
