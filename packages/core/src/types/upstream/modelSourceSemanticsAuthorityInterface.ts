import type { ModelConstant, ModelInheritance, ModelMethod, ModelMethodVisibility } from './model';
import type { ClassName, MethodName, TraitName } from './names';
import type { SourceSpan } from './provenance';
import type { SourceStatements } from './sourceStatements';
import type { TypeExpression } from './typeVocabulary';

export type ModelMethodReturnTypeEvidence =
  | { readonly kind: 'absent' }
  | { readonly kind: 'class_reference'; readonly name: ClassName }
  | { readonly kind: 'unsupported_type_expression' };

export interface ModelMethodSourceEvidence {
  readonly kind: 'model_method_source_evidence';
  readonly name: MethodName;
  readonly visibility: ModelMethodVisibility;
  readonly returnType: ModelMethodReturnTypeEvidence;
  readonly body: SourceStatements;
  readonly source: SourceSpan;
}

export interface ModelSourceSemanticsEvidence {
  readonly kind: 'model_source_semantics_evidence';
  readonly inheritance: ModelInheritance;
  readonly traits: readonly TraitName[];
  readonly methods: readonly ModelMethodSourceEvidence[];
  readonly constants: readonly ModelConstant[];
}

export interface ModelSourceSemanticsJudgment {
  readonly kind: 'model_source_semantics_resolved';
  readonly inheritance: ModelInheritance;
  readonly capabilities: { readonly kind: 'model_source_capabilities'; readonly traits: { readonly kind: 'model_traits'; readonly items: readonly TraitName[] } };
  readonly methods: readonly ModelMethod[];
  readonly constants: readonly ModelConstant[];
}

export interface ModelSourceSemanticsAuthorityInterface {
  readonly kind: 'model_source_semantics_authority';
  readonly contractVersion: 1;
  judge(evidence: ModelSourceSemanticsEvidence): ModelSourceSemanticsJudgment;
}
