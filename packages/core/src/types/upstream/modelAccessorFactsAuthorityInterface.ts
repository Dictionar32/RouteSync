import type { Expression } from './expression';
import type { ModelAccessorFact } from './modelSourceFacts';
import type { ModelAccessorVisibility } from './modelVocabulary';
import type { ClassName, MethodName } from './names';
import type { SourceSpan } from './provenance';

export type ModelAccessorReturnTypeEvidence =
  | { readonly kind: 'absent' }
  | { readonly kind: 'class_reference'; readonly className: ClassName }
  | { readonly kind: 'other_return_type' };

/** Source-backed method evidence; it deliberately contains no compiler-owned AST nodes. */
export interface ModelAccessorMethodEvidence {
  readonly kind: 'model_accessor_method_evidence';
  readonly method: MethodName;
  readonly visibility: ModelAccessorVisibility;
  readonly returnType: ModelAccessorReturnTypeEvidence;
  readonly returnedExpressions: readonly Expression[];
  readonly source: SourceSpan;
}

export interface ModelAccessorFactsAuthorityInput {
  readonly evidence: readonly ModelAccessorMethodEvidence[];
}

/** Upstream authority for Laravel legacy and Attribute-object accessor semantics. */
export interface ModelAccessorFactsAuthorityInterface {
  readonly kind: 'model_accessor_facts_authority';
  readonly contractVersion: 1;
  readonly judge: (input: ModelAccessorFactsAuthorityInput) => readonly ModelAccessorFact[];
}
