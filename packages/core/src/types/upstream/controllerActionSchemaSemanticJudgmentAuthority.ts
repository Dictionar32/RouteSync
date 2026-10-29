import type { RouteSchemaPayload } from '../domain/validationRules';
import { createRouteSchemaPayload } from '../domain/validationRules';
import type { RequestField } from '../domain/request';
import type { SourceFile } from './names';
import type { ControllerActionSchemaDerivation, ControllerActionSchemaRequestEvidence, ControllerActionSchemaRouteRequestEvidence, ControllerActionSchemaSemanticJudgmentAuthorityInterface, RouteRequestSchemaEvidenceUnavailable } from './controllerActionSchemaSemanticJudgmentInterface';
import type { ControllerInlineSchemaEvidence } from './controllerBodySemanticJudgmentInterface';

/**
 * Schema-specific continuation contracts. Each outcome owns the domain operation
 * for deriving a FormRequest schema; callers do not provide generic callbacks.
 */
interface EmptyInlineSchemaEvidence {
  readonly kind: 'empty_inline_schema';
  readonly deriveFormRequestSchema: (fields: readonly RequestField[]) => ControllerActionSchemaDerivation;
}

interface PresentInlineSchemaEvidence {
  readonly kind: 'present_inline_schema';
  readonly deriveFormRequestSchema: (fields: readonly RequestField[]) => ControllerActionSchemaDerivation;
}

type InlineSchemaEvidenceJudgment = EmptyInlineSchemaEvidence | PresentInlineSchemaEvidence;

const inlineValidationDerivation = (schema: RouteSchemaPayload): ControllerActionSchemaDerivation =>
  Object.freeze({ kind: 'inline_validation_schema', schema } satisfies ControllerActionSchemaDerivation);

const formRequestOnlyDerivation = (fields: readonly RequestField[]): ControllerActionSchemaDerivation =>
  Object.freeze({ kind: 'form_request_schema', schema: createRouteSchemaPayload(fields) } satisfies ControllerActionSchemaDerivation);

const combinedFormRequestDerivation = (
  fields: readonly RequestField[],
  inlineSchema: RouteSchemaPayload,
): ControllerActionSchemaDerivation =>
  Object.freeze({
    kind: 'form_request_and_inline_validation_schema',
    schema: createRouteSchemaPayload(
      [...fields, ...inlineSchema.fields],
      inlineSchema.messages,
      inlineSchema.attributes,
      inlineSchema.validationEntries,
    ),
  } satisfies ControllerActionSchemaDerivation);

const inlineSchemaEvidenceJudgment = (evidence: ControllerInlineSchemaEvidence, schema: RouteSchemaPayload): InlineSchemaEvidenceJudgment => {
  return evidence.kind === 'no_inline_validation_evidence'
    ? Object.freeze({
        kind: 'empty_inline_schema' as const,
        deriveFormRequestSchema: formRequestOnlyDerivation,
      })
    : Object.freeze({
        kind: 'present_inline_schema' as const,
        deriveFormRequestSchema: (fields: readonly RequestField[]) => combinedFormRequestDerivation(fields, schema),
      });
};

const formRequestDerivation = (
  evidence: ControllerInlineSchemaEvidence,
  fields: readonly RequestField[],
  inlineSchema: RouteSchemaPayload,
): ControllerActionSchemaDerivation =>
  inlineSchemaEvidenceJudgment(evidence, inlineSchema).deriveFormRequestSchema(fields);


export interface RouteRequestSchemaEvidenceFactoryInterface {
  readonly unavailable: <TSourceIdentity = SourceFile>(
    reason: RouteRequestSchemaEvidenceUnavailable<TSourceIdentity>['reason'],
  ) => RouteRequestSchemaEvidenceUnavailable<TSourceIdentity>;
}

/** Canonical constructor for explicit schema-evidence absence, including its domain continuation. */
export const routeRequestSchemaEvidenceFactory: RouteRequestSchemaEvidenceFactoryInterface = Object.freeze({
  unavailable: <TSourceIdentity = SourceFile>(
    reason: RouteRequestSchemaEvidenceUnavailable<TSourceIdentity>['reason'],
  ): RouteRequestSchemaEvidenceUnavailable<TSourceIdentity> => {
    let evidence: RouteRequestSchemaEvidenceUnavailable<TSourceIdentity>;
    evidence = Object.freeze({
      kind: 'route_request_schema_evidence_unavailable',
      reason,
      continueToSchema: emptyRouteSchemaPayload,
      continueToRouteBoundarySchema: () => Object.freeze({ schema: emptyRouteSchemaPayload(), schemaEvidence: evidence }),
    });
    return evidence;
  },
});

/**
 * Canonical upstream schema authority. It owns the request/inline-validation merge policy
 * and returns origin together with schema, so consumers cannot repeat the merge.
 */
export const controllerActionSchemaSemanticJudgmentAuthority: ControllerActionSchemaSemanticJudgmentAuthorityInterface<SourceFile> = Object.freeze({
  kind: 'controller_action_schema_semantic_judgment_authority',
  contractVersion: 7,
  sourceCorrelation: 'schema-judgment-retains-the-exact-action-source-identity',
  derivationClosure: 'schema-origin-is-explicit-and-the-canonical-route-schema-payload-is-published-once;inline-validation-presence-is-owned-by-controller-body-source-evidence',
  judge: input => {
    let derivation: ControllerActionSchemaDerivation;
    switch (input.requestEvidence.kind) {
      case 'no_form_request_schema_evidence':
        derivation = inlineValidationDerivation(input.inlineSchema);
        break;
      case 'form_request_schema_evidence':
        derivation = formRequestDerivation(input.inlineSchemaEvidence, input.requestEvidence.source.fields, input.inlineSchema);
        break;
    }
    const inlineValidationEntries = Object.freeze([...input.inlineValidationEntries]);
    const routeRequestEvidence: ControllerActionSchemaRouteRequestEvidence<SourceFile> = Object.freeze({
      kind: 'controller_action_route_request_schema_evidence' as const,
      sourceIdentity: input.sourceIdentity,
      schemaOrigin: derivation.kind,
      schema: derivation.schema,
      inlineValidationEntries,
      continueToSchema: () => derivation.schema,
      continueToRouteBoundarySchema: () => Object.freeze({ schema: derivation.schema, schemaEvidence: routeRequestEvidence }),
    });
    return Object.freeze({
      kind: 'controller_action_schema_semantic_judgment_completed',
      sourceIdentity: input.sourceIdentity,
      derivation,
      inlineValidationEntries,
      routeRequestEvidence,
      forRouteRequest: () => routeRequestEvidence,
    });
  },
});
