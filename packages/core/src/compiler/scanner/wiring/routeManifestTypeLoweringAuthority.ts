import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import type { ObjectType } from '../../../types/domain/semanticType';
import type {
  RequestTypeDerivationJudgmentConsumerInterface,
  RequestTypeDerivationSemanticPipelineInterface,
  RequestTypeDerivationRuntimeExecutionResult,
  RequestTypeEvidenceReference,
  RequestTypeRouteRequestResolutionReceipt,
} from '../../../types/upstream/requestTypeDerivationInterface';
import { createRequestTypeDerivationOperationPreparation } from '../../semantic/request-type-derivation/requestTypeDerivationOperationPreparation';
import type { RouteManifestRequestResolutionPreflight } from './routeManifestProjectionInterface';
import { semanticTypeDerivationAuthority } from '../../semantic/type-derivation/semanticTypeDerivationAuthority';
import { TypeInterner } from '../../types/TypeInterner';
import { routeManifestProjectionInputs } from './routeManifestProjectionInputs';

/**
 * Result of the authority-backed lowering path. A failed or incomplete semantic
 * judgment is deliberately not converted to an empty RequestType list: callers
 * must preserve and handle the authority outcome.
 */
export type AuthorityBackedRouteManifestTypeLoweringResult =
  | Readonly<{
      kind: 'lowered';
      requestTypes: readonly RequestType[];
      semanticTypes: readonly ObjectType[];
      derivation: Extract<RequestTypeDerivationRuntimeExecutionResult, { kind: 'projected' }>;
      sourceEvidence: readonly RequestTypeEvidenceReference[];
      requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt[];
    }>
  | Readonly<{
      kind: 'derivation_not_projectable';
      semanticTypes: readonly ObjectType[];
      derivation: Exclude<RequestTypeDerivationRuntimeExecutionResult, { kind: 'projected' }>;
      sourceEvidence: readonly RequestTypeEvidenceReference[];
      requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt[];
    }>;

export interface AuthorityBackedRouteManifestTypeLoweringInterface {
  readonly project: (preflight: RouteManifestRequestResolutionPreflight) => AuthorityBackedRouteManifestTypeLoweringResult;
}

const judgmentGroupsConsumer: RequestTypeDerivationJudgmentConsumerInterface = Object.freeze({
  project: judgment => judgment.groups,
});

/**
 * Creates the interface-first lowering path. Semantic authority is injected;
 * this adapter cannot instantiate a fake authority or infer RequestType meaning.
 * It consumes one manifest-bound preflight packet, invokes the semantic authority,
 * and projects an already-closed judgment. RequestType derivation is completed upstream; no
 * parameterized runtime executor is inserted merely to return the prepared result.
 * The legacy default path remains separate until a real proof-producing pipeline
 * is wired by the composition root.
 */
export const createAuthorityBackedRouteManifestTypeLowering = (
  pipeline: RequestTypeDerivationSemanticPipelineInterface,
): AuthorityBackedRouteManifestTypeLoweringInterface => {
  const operationPreparation = createRequestTypeDerivationOperationPreparation(pipeline, judgmentGroupsConsumer);

  return Object.freeze({
    project: (preflight: RouteManifestRequestResolutionPreflight): AuthorityBackedRouteManifestTypeLoweringResult => {
      const { routes, resources } = preflight.input;
      const models = routeManifestProjectionInputs.modelAstsFromManifest(preflight.manifest);
      const interner = TypeInterner.create();
      const sourceEvidence = preflight.sourceEvidence;
      const requestResolutionLedger = preflight.requestResolutionLedger;
      const derivation = operationPreparation.prepare(preflight.semanticInput);
      const semanticTypes = semanticTypeDerivationAuthority.resolve({ resources, models, interner, routes }).result;

      switch (derivation.kind) {
        case 'projected':
          return Object.freeze({
            kind: 'lowered',
            requestTypes: derivation.projection,
            semanticTypes,
            derivation,
            sourceEvidence,
            requestResolutionLedger,
          });
        case 'incomplete':
        case 'conflict':
        case 'input_rejected':
        case 'verification_failed':
        case 'rejection_verification_failed':
        case 'authority_inconsistent':
        case 'assessment_integrity_failed':
        case 'authority_integrity_failed':
          return Object.freeze({ kind: 'derivation_not_projectable', semanticTypes, derivation, sourceEvidence, requestResolutionLedger });
        default: {
          const exhaustive: never = derivation;
          return exhaustive;
        }
      }
    },
  });
};
