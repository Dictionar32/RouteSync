import type { ModelCast } from './model';
import type { ClassName, PropertyName } from './names';
import type { SourceSpan } from './provenance';
import type { StringValue } from './valueObjects';

export type ModelCastTargetSourceEvidence =
  | { readonly kind: 'literal_cast_target'; readonly value: StringValue }
  | { readonly kind: 'class_cast_target'; readonly className: ClassName };

/** Source-backed cast evidence after PHP AST extraction, without compiler-owned AST types. */
export interface ModelCastSourceEvidence {
  readonly kind: 'model_cast_source_evidence';
  readonly property: PropertyName;
  readonly target: ModelCastTargetSourceEvidence;
  readonly source: SourceSpan;
}

export interface ModelCastFactsAuthorityInput {
  readonly evidence: readonly ModelCastSourceEvidence[];
}

/** Upstream owner of Laravel cast-target semantics. */
export interface ModelCastFactsAuthorityInterface {
  readonly kind: 'model_cast_facts_authority';
  readonly contractVersion: 1;
  readonly judge: (input: ModelCastFactsAuthorityInput) => readonly ModelCast[];
}
