/**
 * Public, index-free contract for assignment-target recognition.
 *
 * The canonical algebra implements this interface, and scanner runtime wiring
 * supplies its evidence providers directly. Cursor-oriented compatibility APIs
 * are not part of this contract.
 */
import type {
  DelimitedTokenJudgment,
  TokenEvidenceLocation,
  TokenOccurrenceJudgment,
} from './scannerTokenStructureAlgebra';

export type AssignmentTargetEvidenceJudgment<Evidence, Token = never> =
  | Readonly<{ readonly kind: 'resolved'; readonly evidence: Evidence }>
  | Readonly<{ readonly kind: 'unresolved' }>
  | Readonly<{ readonly kind: 'malformed'; readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>;

export type AssignmentTargetMemberEvidence<Expression, Identifier> = Readonly<{
  readonly receiver: Expression;
  readonly property: Identifier;
}>;

export type AssignmentTargetArrayAccessEvidence<Expression> = Readonly<{
  readonly target: Expression;
  readonly index: Expression;
}>;

export type AssignmentTargetQuery<Token, Expression, Identifier, Target, Entry, Pattern> = Readonly<{
  readonly tokens: readonly Token[];
  readonly tokenValue: (token: Token | undefined) => string;
  readonly isVariableToken: (token: Token | undefined) => boolean;
  readonly variableIdentifier: (token: Token) => Identifier;
  readonly locateTopLevel: (tokens: readonly Token[], token: string) => TokenOccurrenceJudgment<Token>;
  readonly matchLeadingDelimiter: (tokens: readonly Token[]) => DelimitedTokenJudgment<Token>;
  readonly classifyExpression: (tokens: readonly Token[]) => Expression;
  readonly classifyArrayAccess: (tokens: readonly Token[]) => AssignmentTargetEvidenceJudgment<AssignmentTargetArrayAccessEvidence<Expression>, Token>;
  readonly classifyMember: (tokens: readonly Token[]) => AssignmentTargetEvidenceJudgment<AssignmentTargetMemberEvidence<Expression, Identifier>, Token>;
  readonly classifyStaticProperty: (tokens: readonly Token[]) => AssignmentTargetEvidenceJudgment<Target, Token>;
  readonly variableTarget: (identifier: Identifier) => Target;
  readonly appendTarget: (receiver: Expression) => Target;
  readonly arrayElementTarget: (evidence: AssignmentTargetArrayAccessEvidence<Expression>) => Target;
  readonly propertyTarget: (evidence: AssignmentTargetMemberEvidence<Expression, Identifier>) => Target;
  readonly destructuringTarget: (pattern: Pattern) => Target;
  readonly listPattern: (entries: readonly Entry[]) => Pattern;
  readonly skippedEntry: () => Entry;
  readonly keyedEntry: (key: Expression, target: Entry) => Entry;
  readonly nestedEntry: (pattern: Pattern) => Entry;
  readonly referenceVariableEntry: (identifier: Identifier) => Entry;
  readonly variableEntry: (identifier: Identifier) => Entry;
  readonly patternOfTarget: (target: Target) => AssignmentTargetEvidenceJudgment<Pattern, Token>;
}>;

export type AssignmentTargetJudgment<Token, Target> =
  | Readonly<{ readonly kind: 'resolved'; readonly target: Target }>
  | Readonly<{ readonly kind: 'unresolved'; readonly reason: 'empty_target' | 'invalid_destructuring' | 'invalid_target' }>
  | Readonly<{
      readonly kind: 'malformed';
      readonly location: TokenEvidenceLocation<Token>;
      readonly expected?: string;
      readonly actual: string;
    }>
  | Readonly<{ readonly kind: 'contract_violation'; readonly reason: 'invalid_delimiter_evidence' | 'invalid_operator_evidence' }>;

/** Semantic boundary for assignment-target classification. */
export interface ScannerAssignmentTargetInterface {
  readonly resolve: <Token, Expression, Identifier, Target, Entry, Pattern>(
    query: AssignmentTargetQuery<Token, Expression, Identifier, Target, Entry, Pattern>,
  ) => AssignmentTargetJudgment<Token, Target>;
}
