import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import type { ObjectType } from '../../../types/domain/semanticType';
import type {
  RequestTypeDerivationJudgmentConsumerInterface,
  RequestTypeDerivationProjectableJudgment,
  RequestTypeDerivationSemanticPipelineInterface,
  RequestTypeDerivationProjectableRuntimeExecutionData,
  RequestTypeDerivationBlockedRuntimeExecutionData,
  RequestTypeEvidenceReference,
  RequestTypeRouteRequestResolutionReceipt,
} from '../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationOperationPreparationFactory } from '../../semantic/request-type-derivation/requestTypeDerivationOperationPreparation';
import type { RouteManifestRequestResolutionPreflight } from './routeManifestProjectionInterface';
import { semanticTypeDerivationAuthority } from '../../semantic/type-derivation/semanticTypeDerivationAuthority';
import { TypeInterner } from '../../types/TypeInterner';
import { routeManifestProjectionInputs } from './routeManifestProjectionInputs';
import type { RouteManifestProjectionCompositionResult } from './routeManifestProjectionOutcome';

/** Payload for a verified derivation that can be lowered into a manifest. */
export interface AuthorityBackedRouteManifestTypeLoweredOutcome {
  readonly kind: 'lowered';
  readonly requestTypes: readonly RequestType[];
  readonly semanticTypes: readonly ObjectType[];
  readonly derivation: RequestTypeDerivationProjectableRuntimeExecutionData;
  readonly sourceEvidence: readonly RequestTypeEvidenceReference[];
  readonly requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt[];
}

/** Payload for a derivation that cannot produce a manifest. */
export interface AuthorityBackedRouteManifestTypeLoweringBlockedOutcome {
  readonly kind: 'derivation_not_projectable';
  readonly semanticTypes: readonly ObjectType[];
  readonly derivation: RequestTypeDerivationBlockedRuntimeExecutionData;
  readonly sourceEvidence: readonly RequestTypeEvidenceReference[];
  readonly requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt[];
}

/**
 * Domain-specific continuation owned by the lowering result. It lets manifest
 * composition handle each concrete lowering outcome without inspecting `kind`.
 * This is deliberately concrete and non-generic; it is not a reasoning primitive.
 */
export interface AuthorityBackedRouteManifestTypeLoweringOutcomeHandlers {
  readonly lowered: (outcome: AuthorityBackedRouteManifestTypeLoweredOutcome) => RouteManifestProjectionCompositionResult;
  readonly derivation_not_projectable: (outcome: AuthorityBackedRouteManifestTypeLoweringBlockedOutcome) => RouteManifestProjectionCompositionResult;
}

/**
 * The ADT carries its domain continuation as well as its evidence. Its producer
 * installs the continuation for the concrete variant, so composition does not
 * need a second semantic `switch` to decide how to consume the result.
 */
export type AuthorityBackedRouteManifestTypeLoweringResult =
  | (Readonly<AuthorityBackedRouteManifestTypeLoweredOutcome> & Readonly<{
      readonly continue: (handlers: AuthorityBackedRouteManifestTypeLoweringOutcomeHandlers) => RouteManifestProjectionCompositionResult;
    }>)
  | (Readonly<AuthorityBackedRouteManifestTypeLoweringBlockedOutcome> & Readonly<{
      readonly continue: (handlers: AuthorityBackedRouteManifestTypeLoweringOutcomeHandlers) => RouteManifestProjectionCompositionResult;
    }>);

export interface AuthorityBackedRouteManifestTypeLoweringInterface {
  readonly project: (preflight: RouteManifestRequestResolutionPreflight) => AuthorityBackedRouteManifestTypeLoweringResult;
}

const judgmentGroupsConsumer: RequestTypeDerivationJudgmentConsumerInterface = Object.freeze({
  project: (judgment: RequestTypeDerivationProjectableJudgment) => judgment.groups,
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
export interface AuthorityBackedRouteManifestTypeLoweringFactoryInterface {
  readonly create: (
    pipeline: RequestTypeDerivationSemanticPipelineInterface,
  ) => AuthorityBackedRouteManifestTypeLoweringInterface;
}

export const authorityBackedRouteManifestTypeLoweringFactory: AuthorityBackedRouteManifestTypeLoweringFactoryInterface = Object.freeze({
  create: (
    pipeline: RequestTypeDerivationSemanticPipelineInterface,
  ): AuthorityBackedRouteManifestTypeLoweringInterface => {
  const operationPreparation = requestTypeDerivationOperationPreparationFactory.create(pipeline, judgmentGroupsConsumer);

  return Object.freeze({
    project: (preflight: RouteManifestRequestResolutionPreflight): AuthorityBackedRouteManifestTypeLoweringResult => {
      const { routes, resources } = preflight.input;
      const models = routeManifestProjectionInputs.modelAstsFromManifest(preflight.manifest);
      const interner = TypeInterner.create();
      const sourceEvidence = preflight.sourceEvidence;
      const requestResolutionLedger = preflight.requestResolutionLedger;
      const derivation = operationPreparation.prepare(preflight.semanticInput);
      const semanticTypes = semanticTypeDerivationAuthority.resolve({ resources, models, interner, routes }).result;

      // The upstream ADT owns this domain decision. The lowering consumer does
      // not provide a visitor or reclassify the derivation's primitive kind.
      const disposition = derivation.toManifestProjectionDisposition();

      switch (disposition.kind) {
        case 'request_type_derivation_projectable': {
          const projectable = disposition.derivation;
          const outcome: AuthorityBackedRouteManifestTypeLoweredOutcome = Object.freeze({
            kind: 'lowered',
            requestTypes: projectable.projection,
            semanticTypes,
            derivation: projectable,
            sourceEvidence,
            requestResolutionLedger,
          });
          return Object.freeze({
            ...outcome,
            continue: (handlers: AuthorityBackedRouteManifestTypeLoweringOutcomeHandlers): RouteManifestProjectionCompositionResult =>
              handlers.lowered(outcome),
          });
        }
        case 'request_type_derivation_not_projectable': {
          const outcome: AuthorityBackedRouteManifestTypeLoweringBlockedOutcome = Object.freeze({
            kind: 'derivation_not_projectable',
            semanticTypes,
            derivation: disposition.derivation,
            sourceEvidence,
            requestResolutionLedger,
          });
          return Object.freeze({
            ...outcome,
            continue: (handlers: AuthorityBackedRouteManifestTypeLoweringOutcomeHandlers): RouteManifestProjectionCompositionResult =>
              handlers.derivation_not_projectable(outcome),
          });
        }
        default: {
          const exhaustive: never = disposition;
          return exhaustive;
        }
      }
    },
  });
  },
});
