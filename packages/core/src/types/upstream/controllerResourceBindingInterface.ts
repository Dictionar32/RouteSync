import type { ControllerModelOrigin, ControllerResponseReferenceJudgment, ControllerResourceBinding } from './controller';
import type { ControllerStaticCallOriginInput } from './controllerStaticCallOriginInterface';
import type { ControllerVariableSemanticJudgment } from './controllerVariableSemanticInterface';
import type { ResourceName } from '../domain/semanticValues';
import type { MethodName } from './names';
import type { ResponseReference } from './semanticReferences';
import type { SourceSpan } from './provenance';

/** Model-origin evidence is projected from AST structure without deciding its meaning. */
export type ControllerResourceModelOriginEvidence =
  | Readonly<{ readonly kind: 'variable_semantic_judgment'; readonly judgment: ControllerVariableSemanticJudgment }>
  | Readonly<{ readonly kind: 'variable_semantic_missing' }>
  | Readonly<{ readonly kind: 'static_call_origin_input'; readonly input: ControllerStaticCallOriginInput }>
  | Readonly<{ readonly kind: 'method_chain_receiver'; readonly receiver: ControllerResourceModelOriginEvidence }>
  | Readonly<{ readonly kind: 'unsupported_expression' }>;

export type ControllerResourceCollectionArgumentEvidence =
  | Readonly<{ readonly kind: 'positional'; readonly modelOrigin: ControllerResourceModelOriginEvidence }>
  | Readonly<{ readonly kind: 'absent' }>
  | Readonly<{ readonly kind: 'unsupported_argument_shape' }>;


/** Candidate evidence identifies the AST construct; the authority decides whether it is a resource binding. */
export type ControllerResourceBindingCandidate =
  | Readonly<{
      readonly kind: 'direct_resource';
      readonly resourceName: ResourceName;
      readonly modelOrigin: ControllerResourceModelOriginEvidence;
      readonly response: ControllerResponseReferenceJudgment;
    }>
  | Readonly<{
      readonly kind: 'static_call';
      readonly resourceName: ResourceName;
      readonly methodName: MethodName;
      readonly argument: ControllerResourceCollectionArgumentEvidence;
      readonly response: ControllerResponseReferenceJudgment;
    }>
  | Readonly<{ readonly kind: 'other_expression' }>;

export type ControllerResourceBindingJudgment =
  | Readonly<{
      readonly kind: 'resolved';
      readonly rule: 'direct_resource_model_origin' | 'resource_collection_model_origin';
      readonly resourceName: ResourceName;
      readonly model: ControllerModelOrigin;
      readonly response: ResponseReference;
      readonly closed: true;
    }>
  | Readonly<{ readonly kind: 'unresolved'; readonly reason: 'response_reference_not_declared' | 'model_origin_missing' | 'model_origin_unresolved' | 'collection_argument_absent' | 'collection_argument_unsupported'; readonly closed: true }>
  | Readonly<{ readonly kind: 'not_applicable'; readonly closed: true }>;

/** Already-judged resource facts plus exact provenance, ready for canonical domain publication. */
export interface ControllerResourceBindingPublicationInput {
  readonly resourceName: ResourceName;
  readonly model: ControllerModelOrigin;
  readonly response: ResponseReference;
  readonly source: SourceSpan;
}

/** Closed judgment for interpreting model-origin evidence without leaking partial values. */
export type ControllerResourceModelOriginJudgment =
  | Readonly<{ readonly kind: 'resolved'; readonly origin: ControllerModelOrigin; readonly closed: true }>
  | Readonly<{ readonly kind: 'missing'; readonly closed: true }>
  | Readonly<{ readonly kind: 'unresolved'; readonly closed: true }>;

/** A declared applicability rule; method matching and semantic outcome share one typed contract. */
export interface ControllerResourceStaticCallRuleInterface {
  readonly kind: 'controller_resource_static_call_rule';
  readonly methodName: MethodName;
  readonly judge: (candidate: Extract<ControllerResourceBindingCandidate, { readonly kind: 'static_call' }>) => ControllerResourceBindingJudgment;
}

/** Sole upstream authority for correlating resource-return evidence, model origin and response identity. */
export interface ControllerResourceBindingAuthorityInterface {
  readonly kind: 'controller_resource_binding_authority';
  readonly contractVersion: 8;
  readonly judgmentContract: 'closed_model_origin_judgment_and_canonical_controller_response_are_correlated_and_static_call_applicability_is_judged_upstream';
  readonly responseContractRule: 'reuse_declared_response_reference_judgment_without_claiming_http_return_presence';
  readonly staticCallRules: readonly ControllerResourceStaticCallRuleInterface[];
  readonly staticCallRule: 'static_call_applicability_is_resolved_by_typed_rule_registration_not_method_name_switch';
  readonly judgeModelOrigin: (evidence: ControllerResourceModelOriginEvidence) => ControllerResourceModelOriginJudgment;
  readonly judge: (candidate: ControllerResourceBindingCandidate) => ControllerResourceBindingJudgment;
  /** Publishes an already-resolved judgment as canonical domain knowledge without reclassifying it. */
  readonly publishResolved: (input: ControllerResourceBindingPublicationInput) => ControllerResourceBinding;
}
