import type { TypeExpression } from './typeVocabulary';

/** Class facts supplied by upstream declaration analysis; the atom algebra never discovers them itself. */
export type PhpTypeClassContext = Readonly<{
  readonly enclosingClass?: string;
  readonly parentClass?: string;
}>;

/** Source atom evidence before PHP type grammar is composed around it. */
export type PhpTypeAtomEvidence = Readonly<{
  readonly source: string;
  readonly classContext?: PhpTypeClassContext;
}>;

/**
 * Closed judgment for one PHP type atom. `unsupported` means recognizable source
 * semantics exceed current context/vocabulary; `malformed` means the atom itself is invalid.
 */
export type PhpTypeAtomJudgment =
  | Readonly<{ readonly kind: 'resolved'; readonly expression: TypeExpression }>
  | Readonly<{ readonly kind: 'unsupported'; readonly source: string; readonly reason: 'context_required' | 'missing_vocabulary'; readonly diagnostic: string }>
  | Readonly<{ readonly kind: 'malformed'; readonly source: string; readonly reason: 'invalid_atom'; readonly diagnostic: string }>; 

/** Single semantic authority for primitive and named PHP type atoms. */
export interface PhpTypeAtomInterface {
  readonly resolve: (evidence: PhpTypeAtomEvidence) => PhpTypeAtomJudgment;
}
