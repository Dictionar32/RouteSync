import type { FormRequestSource } from '../domain/request';
import type { ClassName, RequestName } from './names';
import type { PhpParameterTypeEvidence } from './phpParameterTypeInterface';
import type { LaravelControllerRequestSemanticBinding } from './laravelControllerRequestSemanticBinding';

/** FormRequest identity correlated to the source-declared request parameter. */
export type LaravelControllerFormRequestBindingEvidence = Readonly<{
  readonly requestType: RequestName;
  readonly source: FormRequestSource;
}>;

/** One parameter's typed source evidence; no request classification is performed by the wiring. */
export type LaravelControllerRequestParameterEvidence =
  | Readonly<{ readonly kind: 'request_origin'; readonly requestType: RequestName; readonly declaredType: PhpParameterTypeEvidence }>
  | Readonly<{ readonly kind: 'non_request_parameter' }>;

/** Complete parameter inventory lets the authority own selection, request-kind derivation, and type resolution. */
export type LaravelControllerRequestBindingEvidence = Readonly<{
  readonly kind: 'controller_method_parameters';
  readonly parameters: readonly LaravelControllerRequestParameterEvidence[];
  readonly formRequests: readonly LaravelControllerFormRequestBindingEvidence[];
}>;

/** Parser-specific evidence projection contract; it cannot publish a semantic request judgment. */
export interface LaravelControllerRequestBindingEvidenceProjectionInterface<TMethodEvidence, TFormRequestIndex> {
  readonly kind: 'laravel_controller_request_binding_evidence_projection';
  readonly output: 'closed-controller-method-parameter-inventory-evidence';
  readonly project: (input: Readonly<{
    readonly method: TMethodEvidence;
    readonly formRequestIndex: TFormRequestIndex;
  }>) => LaravelControllerRequestBindingEvidence;
}

/** Closed semantic authority for publishing canonical controller request-binding knowledge. */
export interface LaravelControllerRequestSemanticBindingAuthorityInterface {
  readonly kind: 'laravel_controller_request_semantic_binding_authority';
  readonly judgmentShape: 'source-parameter-inventory-to-closed-request-binding-judgment-with-preserved-type-resolution-outcomes';
  readonly rulePrecedence: readonly [
    'no_request_origin_yields_no_request',
    'matched_form_request_source_yields_form_request',
    'matched_framework_request_type_yields_framework_request',
    'otherwise_resolve_declared_php_parameter_type',
    'unsupported_or_malformed_resolution_yields_typed_unresolved',
  ];
  readonly judge: (evidence: LaravelControllerRequestBindingEvidence) => LaravelControllerRequestSemanticBinding;
}
