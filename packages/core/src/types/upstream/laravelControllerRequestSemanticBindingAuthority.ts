import type { LaravelControllerRequestSemanticBinding } from './laravelControllerRequestSemanticBinding';
import type { LaravelControllerRequestBindingEvidence, LaravelControllerRequestSemanticBindingAuthorityInterface } from './laravelControllerRequestSemanticBindingInterface';
import { createClassName } from './names';
import { phpParameterTypeAlgebra } from './phpParameterTypeAlgebra';

const frameworkRequestTypes = Object.freeze([
  createClassName('Request'),
  createClassName('Illuminate\\Http\\Request'),
] as const);

const judge = (evidence: LaravelControllerRequestBindingEvidence): LaravelControllerRequestSemanticBinding => {
  const parameter = evidence.parameters.find(candidate => candidate.kind === 'request_origin');
  if (parameter === undefined || parameter.kind !== 'request_origin') {
    return Object.freeze({ kind: 'no_request' });
  }
  const formRequest = evidence.formRequests.find(candidate => candidate.requestType.value.value === parameter.requestType.value.value);
  if (formRequest !== undefined) {
    return Object.freeze({ kind: 'form_request', source: formRequest.source });
  }
  const frameworkRequest = frameworkRequestTypes.find(candidate => candidate.value.value === parameter.requestType.value.value);
  if (frameworkRequest !== undefined) {
    return Object.freeze({ kind: 'framework_request', type: frameworkRequest });
  }
  const judgment = phpParameterTypeAlgebra.resolve(parameter.declaredType);
  switch (judgment.kind) {
    case 'resolved':
      return Object.freeze({ kind: 'typed', type: judgment.expression });
    case 'unsupported':
    case 'malformed':
      return Object.freeze({ kind: 'typed_unresolved', judgment });
  }
};

export const laravelControllerRequestSemanticBindingAuthority: LaravelControllerRequestSemanticBindingAuthorityInterface = Object.freeze({
  kind: 'laravel_controller_request_semantic_binding_authority',
  judgmentShape: 'source-parameter-inventory-to-closed-request-binding-judgment-with-preserved-type-resolution-outcomes',
  rulePrecedence: Object.freeze([
    'no_request_origin_yields_no_request',
    'matched_form_request_source_yields_form_request',
    'matched_framework_request_type_yields_framework_request',
    'otherwise_resolve_declared_php_parameter_type',
    'unsupported_or_malformed_resolution_yields_typed_unresolved',
  ] as const),
  judge,
});
