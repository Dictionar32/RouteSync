import type { TypeExpression } from './typeVocabulary';
import type { PhpTypeClassContext } from './phpTypeAtomInterface';

/** Typed semantic knowledge acquired from a PHP parameter/return type AST. */
export type PhpParameterTypeEvidence =
  | Readonly<{ readonly kind: 'primitive'; readonly name: 'string' | 'int' | 'float' | 'bool' | 'mixed' | 'array'; readonly classContext?: PhpTypeClassContext }>
  | Readonly<{ readonly kind: 'named'; readonly name: string; readonly classContext?: PhpTypeClassContext }>
  | Readonly<{ readonly kind: 'nullable'; readonly inner: PhpParameterTypeEvidence; readonly classContext?: PhpTypeClassContext }>;

/** Closed result: a consumer must not reinterpret the source type. */
export type PhpParameterTypeJudgment =
  | Readonly<{ readonly kind: 'resolved'; readonly expression: TypeExpression }>
  | Readonly<{ readonly kind: 'unsupported'; readonly source: string; readonly reason: 'context_required' | 'missing_vocabulary'; readonly diagnostic: string }>
  | Readonly<{ readonly kind: 'malformed'; readonly diagnostic: string }>; 

export interface PhpParameterTypeInterface {
  readonly resolve: (evidence: PhpParameterTypeEvidence) => PhpParameterTypeJudgment;
}
