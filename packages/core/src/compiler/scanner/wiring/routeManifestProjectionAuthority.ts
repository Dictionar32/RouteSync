import type { RouteManifestRequestResolutionPreflight } from './routeManifestProjectionInterface';
import type {
  RequestTypeDerivationSemanticPipelineInterface,
  RequestTypeDerivationRuntimeExecutionResult,
  RequestTypeEvidenceReference,
  RequestTypeRouteRequestResolutionReceipt,
} from '../../../types/upstream/requestTypeDerivationInterface';
import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import type { ObjectType } from '../../../types/domain/semanticType';
import { createAuthorityBackedRouteManifestTypeLowering } from './routeManifestTypeLoweringAuthority';

/**
 * Authority-backed projection outcome. A failed semantic judgment is carried to
 * the caller; it is never silently downgraded to an empty RequestType array or
 * replaced with the legacy solver's result.
 */
export type AuthorityBackedRouteManifestProjectionResult =
  | Readonly<{
      kind: 'projected';
      requestTypes: readonly RequestType[];
      semanticTypes: readonly ObjectType[];
      derivation: Extract<RequestTypeDerivationRuntimeExecutionResult, { kind: 'projected' }>;
      sourceEvidence: readonly RequestTypeEvidenceReference[];
      requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt[];
    }>
  | Readonly<{
      kind: 'not_projectable';
      semanticTypes: readonly ObjectType[];
      derivation: Exclude<RequestTypeDerivationRuntimeExecutionResult, { kind: 'projected' }>;
      sourceEvidence: readonly RequestTypeEvidenceReference[];
      requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt[];
    }>;

export interface AuthorityBackedRouteManifestProjectionInterface {
  readonly project: (preflight: RouteManifestRequestResolutionPreflight) => AuthorityBackedRouteManifestProjectionResult;
}

/**
 * Interface-first composition root for consumers that require proof-backed
 * RequestType semantics. The authority is injected; this module does not build
 * semantic judgments or reinterpret source evidence.
 */
export const createAuthorityBackedRouteManifestProjection = (
  pipeline: RequestTypeDerivationSemanticPipelineInterface,
): AuthorityBackedRouteManifestProjectionInterface => {
  const lowering = createAuthorityBackedRouteManifestTypeLowering(pipeline);

  return Object.freeze({
    project: (preflight: RouteManifestRequestResolutionPreflight): AuthorityBackedRouteManifestProjectionResult => {
      const result = lowering.project(preflight);
      switch (result.kind) {
        case 'lowered':
          return Object.freeze({
            kind: 'projected',
            requestTypes: result.requestTypes,
            semanticTypes: result.semanticTypes,
            derivation: result.derivation,
            sourceEvidence: result.sourceEvidence,
            requestResolutionLedger: result.requestResolutionLedger,
          });
        case 'derivation_not_projectable':
          return Object.freeze({
            kind: 'not_projectable',
            semanticTypes: result.semanticTypes,
            derivation: result.derivation,
            sourceEvidence: result.sourceEvidence,
            requestResolutionLedger: result.requestResolutionLedger,
          });
        default: {
          const exhaustive: never = result;
          return exhaustive;
        }
      }
    },
  });
};
