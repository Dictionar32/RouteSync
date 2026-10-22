import type { RouteSemanticFlow } from '../../../types/route';
import type { RequestAst, ResourceAst } from '../../../types/upstream/ast';
import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import type { TypeInterner } from '../../types/TypeInterner';

/**
 * Compiler projection boundary for RequestType derivation.
 *
 * This interface keeps scanner wiring ignorant of Request identity lookup,
 * resource grouping, action reconciliation, and response contribution policy.
 * Those decisions belong to the semantic solver. This is intentionally a
 * projection contract, not a claim that the closed proof-authority pipeline
 * has already been wired into this legacy RequestType artifact path.
 */
export interface RequestTypeDerivationProjectionInput {
  readonly routes: readonly RouteSemanticFlow[];
  readonly resources: readonly ResourceAst[];
  readonly requests: readonly RequestAst[];
  readonly interner: TypeInterner;
}

export interface RequestTypeDerivationProjectionInterface {
  readonly derive: (input: RequestTypeDerivationProjectionInput) => readonly RequestType[];
}
