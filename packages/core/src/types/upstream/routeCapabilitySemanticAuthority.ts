/**
 * Canonical upstream semantic authority for non-CRUD route capability facets.
 *
 * This module accepts already-typed route evidence and returns closed semantic
 * capability facets. Compiler/scanner/CLI layers must only adapt evidence into
 * this boundary; they must not re-derive hook, payload, content-type, or error
 * semantics themselves.
 */
import type { HttpErrorResponseDescriptor } from '../domain/httpErrors';
import { httpErrorResponseUnauthorized, httpErrorResponseValidation } from '../domain/httpErrors';
import type { RouteSchemaPayload } from '../domain/validationRules';
import type { RouteRequestBinding } from '../domain/request';
import { RouteSemanticFlowExecutionSignature } from '../domain/executionSignatures';
import { routePayloadLocationFromMethod, type RoutePayloadLocation, type RoutePayloadLocationDecision } from './routeExecutionVocabulary';
import type { RouteActionKind, RouteExecutionSignature, RouteHookKind, RequestContentType } from './routeExecutionVocabulary';
import { RequestContentType as RequestContentTypeValue, RouteHookKind as RouteHookKindValue } from './routeExecutionVocabulary';
import type { TruthValue } from './valueObjects';
import { semanticReasoningContract, type SemanticReasoningContract } from './semanticReasoning';
import { RouteSemanticFlowCacheInvalidationDescriptor } from '../domain/cacheInvalidation';
import type { Presence } from './primitiveVocabulary';
import { presenceFold, presenceOf } from './presence';
import { relationAny, relationEqual, relationGate } from '../../semantic/foundation/semanticRelations';
import { relationProject, relationTextSlice, relationVariantFold } from '../../semantic/foundation/relationalSequence';
import type { BaseValidationRuleNode } from '../domain/validationRules';
import { createActionName, type ActionName, type DomainTypeName, type RoutePath } from './names';
import type { RouteCapabilityCrudEvidence } from './route';
import type { CrudRole } from './routeExecutionVocabulary';
import { CRUD_ROLE_REGISTRY } from '../domain/crudRoles';
import type { HttpMethod } from './routeExecutionVocabulary';

export interface RouteCapabilitySemanticEvidence {
  /** Raw route facts entering the upstream semantic authority. */
  readonly actionKind: RouteActionKind;
  readonly isMutating: boolean;
  readonly parameterCount: number;
  readonly method: HttpMethod;
  readonly path: RoutePath;
  readonly domain: DomainTypeName;
  readonly action: ActionName;
  readonly request: RouteRequestBinding;
  readonly schema: RouteSchemaPayload;
  readonly auth: TruthValue;
  /** Closed CRUD evidence produced by the canonical upstream CRUD authority. */
  readonly crudEvidence: RouteCapabilityCrudEvidence;
}

/**
 * Optional upstream evidence supplied by earlier typed boundaries. These are
 * inputs to the same authority, not a second semantic authority.
 */
export interface RouteCapabilitySemanticOverrides {
  readonly hookKind: Presence<RouteHookKind>;
  readonly executionSignature: Presence<RouteExecutionSignature>;
  readonly payloadLocation: Presence<RoutePayloadLocation>;
  /** Explicit schema-role evidence; never inferred from hook execution kind. */
  readonly schemaRole: Presence<'request' | 'response'>;
  readonly requestContentType: Presence<RequestContentType>;
  readonly errorResponses: Presence<readonly HttpErrorResponseDescriptor[]>;
  readonly invalidation: Presence<ReturnType<typeof RouteSemanticFlowCacheInvalidationDescriptor.none>>;
}

/** Compatibility name for the upstream evidence boundary. */
export type RouteCapabilitySemanticInput = RouteCapabilitySemanticEvidence;

export interface RouteCapabilitySemanticResolution {
  readonly hookKind: RouteHookKind;
  readonly crudRole: CrudRole;
  readonly actionName: ActionName;
  readonly crudEvidence: RouteCapabilityCrudEvidence;
  readonly requestContentType: RequestContentType;
  readonly executionSignature: RouteExecutionSignature;
  readonly payloadLocation: RoutePayloadLocation;
  readonly payloadLocationDecision: RoutePayloadLocationDecision;
  readonly schemaRole: 'request' | 'response';
  readonly invalidation: ReturnType<typeof RouteSemanticFlowCacheInvalidationDescriptor.none>;
  /** Proof-carrying upstream reasoning contract for this semantic resolution. */
  readonly reasoning: SemanticReasoningContract<'evidence_resolution'>;
  readonly errorResponses: readonly HttpErrorResponseDescriptor[];
}

const hasRules = (schema: RouteSchemaPayload): boolean =>
  relationEqual(schema.fields.length, 0) === false;

const hasFileRule = (rule: BaseValidationRuleNode): boolean =>
  relationAny([relationEqual(rule.kind, 'file'), relationEqual(rule.kind, 'image')]);

const hasPayload = (isMutating: boolean, schema: RouteSchemaPayload): boolean =>
  relationAny([isMutating, hasRules(schema)]);

const payloadTypeName = (
  request: RouteRequestBinding,
  domain: DomainTypeName,
  action: ActionName,
): string => relationVariantFold(
  request,
  'form_request',
  () => {
    const actionValue = action.value.value;
    return `${domain.value.value}${actionValue.charAt(0).toUpperCase()}${relationTextSlice(actionValue, 1)}Payload`;
  },
  value => value.identity.source.requestClass.value.value,
);

const resolveActionName = (input: RouteCapabilitySemanticEvidence, crudRole: CrudRole): ActionName => {
  if (crudRole === 'custom') return input.action;
  return createActionName(CRUD_ROLE_REGISTRY[crudRole].defaultActionName);
};

const resolveHookKind = (isMutating: boolean): RouteHookKind =>
  relationGate(isMutating, () => RouteHookKindValue.Mutation, () => RouteHookKindValue.Query);

const resolveExecutionSignature = (
  input: RouteCapabilitySemanticEvidence,
  overrides: RouteCapabilitySemanticOverrides,
  hookKind: RouteHookKind,
  payload: boolean,
): RouteExecutionSignature => presenceFold(
  overrides.executionSignature,
  () => RouteSemanticFlowExecutionSignature.create(
    hookKind,
    input.parameterCount > 0,
    payload,
    presenceOf(payloadTypeName(input.request, input.domain, input.action)),
  ),
  value => value,
);

const resolveRequestContentType = (
  input: RouteCapabilitySemanticEvidence,
  overrides: RouteCapabilitySemanticOverrides,
): RequestContentType => presenceFold(
  overrides.requestContentType,
  () => relationGate(
    relationAny([relationEqual(input.method, 'GET'), relationEqual(input.method, 'HEAD')]),
    () => RequestContentTypeValue.None,
    () => relationAny(relationProject(input.schema.fields, field => relationAny(relationProject(field.validation, hasFileRule))))
      ? RequestContentTypeValue.Multipart
      : RequestContentTypeValue.Json,
  ),
  value => value,
);

const defaultErrors = (
  input: RouteCapabilitySemanticEvidence,
  hasValidationRules: boolean,
): readonly HttpErrorResponseDescriptor[] => {
  const validation = relationGate(
    relationAny([input.isMutating, hasValidationRules]),
    () => [httpErrorResponseValidation()],
    () => [],
  );
  const unauthorized = presenceFold(
    presenceOf(input.auth),
    () => [],
    value => relationGate(value.value, () => [httpErrorResponseUnauthorized()], () => []),
  );
  return Object.freeze([...validation, ...unauthorized]);
};

export interface RouteCapabilitySemanticAuthorityAlgebraInterface {
  readonly resolve: (input: RouteCapabilitySemanticEvidence, overrides: RouteCapabilitySemanticOverrides) => RouteCapabilitySemanticResolution;
}

export interface RouteCapabilitySemanticAuthorityContractInterface
  extends RouteCapabilitySemanticAuthorityAlgebraInterface {
  readonly authority: 'upstream';
  readonly closed: true;
}

export interface RouteCapabilitySemanticAuthorityInterface
  extends RouteCapabilitySemanticAuthorityContractInterface {}

export const routeCapabilitySemanticAuthority: RouteCapabilitySemanticAuthorityInterface = Object.freeze({
  authority: 'upstream' as const,
  closed: true as const,
  resolve: (input: RouteCapabilitySemanticEvidence, overrides: RouteCapabilitySemanticOverrides): RouteCapabilitySemanticResolution => {
    const hookKind = presenceFold(overrides.hookKind, () => resolveHookKind(input.isMutating), value => value);
    const validation = hasRules(input.schema);
    const payload = hasPayload(input.isMutating, input.schema);
    const executionSignature = resolveExecutionSignature(input, overrides, hookKind, payload);
    const requestContentType = resolveRequestContentType(input, overrides);
    const payloadLocationDecision: RoutePayloadLocationDecision = presenceFold(
      overrides.payloadLocation,
      () => Object.freeze({
        kind: 'http_method_fallback_policy' as const,
        method: input.method,
        policy: 'laravel_http_method_payload_convention' as const,
        location: routePayloadLocationFromMethod(input.method),
        closed: true as const,
      }),
      value => Object.freeze({
        kind: 'explicit_boundary' as const,
        location: value,
        closed: true as const,
      }),
    );
    const payloadLocation = payloadLocationDecision.location;
    // Laravel validation schemas describe request input. A response schema role
    // must be supplied explicitly by the upstream schema contract; hook kind is
    // an execution capability, not evidence about the meaning of an unkeyed schema.
    const schemaRole = presenceFold(overrides.schemaRole, () => 'request' as const, value => value);
    const crudRole = input.crudEvidence.role;
    const actionName = resolveActionName(input, crudRole);
    const crudEvidence = input.crudEvidence;
    const errorResponses = presenceFold(overrides.errorResponses, () => defaultErrors(input, validation), value => value);
    const invalidation = presenceFold(overrides.invalidation, () => RouteSemanticFlowCacheInvalidationDescriptor.none(), value => value);
    return Object.freeze({
      hookKind,
      crudRole,
      actionName,
      crudEvidence,
      requestContentType,
      executionSignature,
      payloadLocation,
      payloadLocationDecision,
      schemaRole,
      invalidation,
      reasoning: semanticReasoningContract('evidence_resolution'),
      errorResponses: Object.freeze([...errorResponses]),
    });
  },
});

// RouteCapabilitySemanticAuthorityInterface is the canonical typed contract above.
