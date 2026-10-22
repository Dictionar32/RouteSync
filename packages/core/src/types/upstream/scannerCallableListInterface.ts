import type { ScannerTokenStructureInterface, TokenEvidenceLocation } from './scannerTokenStructureInterface';

export type CallableListPurpose = 'arguments' | 'parameters' | 'captures';
export type CallableListEvidence<Token> = Readonly<{
  readonly purpose: CallableListPurpose;
  readonly parts: readonly (readonly Token[])[];
}>;
export type CallableCaptureEvidence<Token> = Readonly<{
  readonly token: Token;
  readonly byReference: boolean;
}>;
export type CallableListJudgment<Token> =
  | Readonly<{ readonly kind: 'resolved'; readonly evidence: CallableListEvidence<Token> }>
  | Readonly<{ readonly kind: 'not_applicable' }>
  | Readonly<{ readonly kind: 'malformed'; readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>
  | Readonly<{ readonly kind: 'contract_violation'; readonly reason: 'invalid_partition_evidence' }>;
export type CallableCaptureJudgment<Token> =
  | Readonly<{ readonly kind: 'resolved'; readonly evidence: readonly CallableCaptureEvidence<Token>[] }>
  | Readonly<{ readonly kind: 'malformed'; readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>
  | Readonly<{ readonly kind: 'contract_violation'; readonly reason: 'invalid_partition_evidence' }>;
export type CallableListQuery<Token> = Readonly<{
  readonly tokens: readonly Token[];
  readonly purpose: CallableListPurpose;
  readonly tokenValue: (token: Token) => string;
  readonly structure: ScannerTokenStructureInterface;
}>;
export type CallableCaptureQuery<Token> = CallableListQuery<Token> & Readonly<{
  readonly tokenKind: (token: Token) => string;
}>;
export interface ScannerCallableListInterface {
  readonly resolveList: <Token>(query: CallableListQuery<Token>) => CallableListJudgment<Token>;
  readonly resolveCaptures: <Token>(query: CallableCaptureQuery<Token>) => CallableCaptureJudgment<Token>;
  readonly resolveParameters: <Token>(query: CallableParameterQuery<Token>) => CallableParameterJudgment<Token>;
  readonly resolveArgument: <Token>(query: CallableArgumentQuery<Token>) => CallableArgumentJudgment<Token>;
}


/** Structural evidence for a parameter before AST-specific type/default projection. */
export type CallableParameterTypeEvidence<Token> =
  | Readonly<{ readonly kind: 'absent' }>
  | Readonly<{ readonly kind: 'primitive'; readonly name: 'string' | 'int' | 'float' | 'bool' | 'mixed' | 'array' }>
  | Readonly<{ readonly kind: 'named'; readonly nameTokens: readonly Token[] }>
  | Readonly<{ readonly kind: 'nullable'; readonly inner: Exclude<CallableParameterTypeEvidence<Token>, { readonly kind: 'absent' } | { readonly kind: 'nullable' }> }>;

export type CallableParameterEvidence<Token> = Readonly<{
  readonly typeTokens: readonly Token[];
  readonly typeEvidence: CallableParameterTypeEvidence<Token>;
  readonly variable: Token;
  readonly defaultTokens: readonly Token[] | undefined;
  readonly byReference: boolean;
  readonly variadic: boolean;
}>;
export type CallableParameterJudgment<Token> =
  | Readonly<{ readonly kind: 'resolved'; readonly evidence: readonly CallableParameterEvidence<Token>[] }>
  | Readonly<{ readonly kind: 'malformed'; readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>
  | Readonly<{ readonly kind: 'contract_violation'; readonly reason: 'invalid_partition_evidence' }>;
export type CallableParameterQuery<Token> = CallableListQuery<Token> & Readonly<{ readonly tokenKind: (token: Token) => string }>;

export type CallableArgumentEvidence<Token> =
  | Readonly<{ readonly kind: 'positional'; readonly valueTokens: readonly Token[] }>
  | Readonly<{ readonly kind: 'named'; readonly name: Token; readonly valueTokens: readonly Token[] }>
  | Readonly<{ readonly kind: 'unpacked'; readonly valueTokens: readonly Token[] }>;
export type CallableArgumentJudgment<Token> =
  | Readonly<{ readonly kind: 'resolved'; readonly evidence: CallableArgumentEvidence<Token> }>
  | Readonly<{ readonly kind: 'malformed'; readonly location: TokenEvidenceLocation<Token>; readonly expected?: string; readonly actual: string }>
  | Readonly<{ readonly kind: 'contract_violation'; readonly reason: 'invalid_partition_evidence' }>;
export type CallableArgumentQuery<Token> = Readonly<{
  readonly tokens: readonly Token[];
  readonly tokenValue: (token: Token) => string;
  readonly tokenKind: (token: Token) => string;
}>;
