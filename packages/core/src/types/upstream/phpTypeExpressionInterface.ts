import type { TypeExpression } from './typeVocabulary';
import type { PhpTypeClassContext } from './phpTypeAtomInterface';

/** Closed semantic judgment for a PHP property type declaration. */
export type PhpTypeExpressionJudgment =
  | Readonly<{ readonly kind: 'resolved'; readonly expression: TypeExpression }>
  | Readonly<{ readonly kind: 'unsupported'; readonly source: string; readonly reason: 'context_required' | 'missing_vocabulary'; readonly diagnostic: string }>
  | Readonly<{ readonly kind: 'malformed'; readonly source: string; readonly diagnostic: string }>; 

export type PhpTypeExpressionEvidence = Readonly<{ readonly source: string; readonly classContext?: PhpTypeClassContext }>;

/** Consumer contract: semantic type interpretation is completed upstream. */
export interface PhpTypeExpressionInterface {
  readonly resolve: (evidence: PhpTypeExpressionEvidence) => PhpTypeExpressionJudgment;
}
