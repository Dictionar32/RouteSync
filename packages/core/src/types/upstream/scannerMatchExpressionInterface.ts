import type { ScannerTokenStructureInterface } from './scannerTokenStructureInterface';

/**
 * Interface-first contract for PHP match-expression structural reasoning.
 * This file defines the semantic boundary only: no scanning algorithm,
 * AST construction, runtime wiring, or downstream projection belongs here.
 */
export const SCANNER_MATCH_RESOLVED: unique symbol = Symbol('SCANNER_MATCH_RESOLVED');
export const SCANNER_MATCH_NOT_APPLICABLE: unique symbol = Symbol('SCANNER_MATCH_NOT_APPLICABLE');
export const SCANNER_MATCH_MALFORMED: unique symbol = Symbol('SCANNER_MATCH_MALFORMED');
export const SCANNER_MATCH_CONTRACT_VIOLATION: unique symbol = Symbol('SCANNER_MATCH_CONTRACT_VIOLATION');

export const SCANNER_MATCH_ARM_CONDITIONAL: unique symbol = Symbol('SCANNER_MATCH_ARM_CONDITIONAL');
export const SCANNER_MATCH_ARM_DEFAULT: unique symbol = Symbol('SCANNER_MATCH_ARM_DEFAULT');

export const SCANNER_MATCH_LOCATION_TOKEN: unique symbol = Symbol('SCANNER_MATCH_LOCATION_TOKEN');
export const SCANNER_MATCH_LOCATION_END: unique symbol = Symbol('SCANNER_MATCH_LOCATION_END');

export const SCANNER_MATCH_EXPECTED_SUBJECT: unique symbol = Symbol('SCANNER_MATCH_EXPECTED_SUBJECT');
export const SCANNER_MATCH_EXPECTED_BODY: unique symbol = Symbol('SCANNER_MATCH_EXPECTED_BODY');
export const SCANNER_MATCH_EXPECTED_ARM: unique symbol = Symbol('SCANNER_MATCH_EXPECTED_ARM');
export const SCANNER_MATCH_EXPECTED_FAT_ARROW: unique symbol = Symbol('SCANNER_MATCH_EXPECTED_FAT_ARROW');
export const SCANNER_MATCH_EXPECTED_ARM_VALUE: unique symbol = Symbol('SCANNER_MATCH_EXPECTED_ARM_VALUE');
export const SCANNER_MATCH_EMPTY_BODY: unique symbol = Symbol('SCANNER_MATCH_EMPTY_BODY');
export const SCANNER_MATCH_EMPTY_CONDITION: unique symbol = Symbol('SCANNER_MATCH_EMPTY_CONDITION');
export const SCANNER_MATCH_MULTIPLE_FAT_ARROWS: unique symbol = Symbol('SCANNER_MATCH_MULTIPLE_FAT_ARROWS');
export const SCANNER_MATCH_MALFORMED_DELIMITER: unique symbol = Symbol('SCANNER_MATCH_MALFORMED_DELIMITER');
export const SCANNER_MATCH_DUPLICATE_DEFAULT: unique symbol = Symbol('SCANNER_MATCH_DUPLICATE_DEFAULT');
export const SCANNER_MATCH_DEFAULT_WITH_CONDITIONS: unique symbol = Symbol('SCANNER_MATCH_DEFAULT_WITH_CONDITIONS');

/** Contract failures are distinct from malformed source syntax. */
export const SCANNER_MATCH_INCOMPLETE_RESOLVED_EVIDENCE: unique symbol = Symbol('SCANNER_MATCH_INCOMPLETE_RESOLVED_EVIDENCE');
export const SCANNER_MATCH_INCONSISTENT_PARTITION: unique symbol = Symbol('SCANNER_MATCH_INCONSISTENT_PARTITION');
export const SCANNER_MATCH_STRUCTURE_AUTHORITY_FAILURE: unique symbol = Symbol('SCANNER_MATCH_STRUCTURE_AUTHORITY_FAILURE');

export type ScannerMatchEvidenceLocation<Token> =
  | Readonly<{ readonly kind: typeof SCANNER_MATCH_LOCATION_TOKEN; readonly evidence: Token }>
  | Readonly<{ readonly kind: typeof SCANNER_MATCH_LOCATION_END }>;

export type ScannerMatchMalformedReason =
  | typeof SCANNER_MATCH_EXPECTED_SUBJECT
  | typeof SCANNER_MATCH_EXPECTED_BODY
  | typeof SCANNER_MATCH_EXPECTED_ARM
  | typeof SCANNER_MATCH_EXPECTED_FAT_ARROW
  | typeof SCANNER_MATCH_EXPECTED_ARM_VALUE
  | typeof SCANNER_MATCH_EMPTY_BODY
  | typeof SCANNER_MATCH_EMPTY_CONDITION
  | typeof SCANNER_MATCH_MULTIPLE_FAT_ARROWS
  | typeof SCANNER_MATCH_MALFORMED_DELIMITER
  | typeof SCANNER_MATCH_DUPLICATE_DEFAULT
  | typeof SCANNER_MATCH_DEFAULT_WITH_CONDITIONS;

export type ScannerMatchContractViolationReason =
  | typeof SCANNER_MATCH_INCOMPLETE_RESOLVED_EVIDENCE
  | typeof SCANNER_MATCH_INCONSISTENT_PARTITION
  | typeof SCANNER_MATCH_STRUCTURE_AUTHORITY_FAILURE;

/** Source-backed partitions. Tokens are preserved; this contract never builds AST nodes. */
export type ScannerMatchArmEvidence<Token> =
  | Readonly<{
      readonly kind: typeof SCANNER_MATCH_ARM_CONDITIONAL;
      readonly source: readonly Token[];
      readonly conditions: readonly (readonly Token[])[];
      /** Comma tokens between conditions, preserved as source evidence. */
      readonly conditionSeparators: readonly Token[];
      /** The exact `=>` token; named by grammar role, not generic separator. */
      readonly fatArrow: Token;
      readonly value: readonly Token[];
      /** Comma after this arm, when present; the token remains source evidence. */
      readonly armSeparatorAfter?: Token;
    }>
  | Readonly<{
      readonly kind: typeof SCANNER_MATCH_ARM_DEFAULT;
      readonly source: readonly Token[];
      readonly defaultToken: Token;
      /** The exact `=>` token; named by grammar role, not generic separator. */
      readonly fatArrow: Token;
      readonly value: readonly Token[];
      /** Comma after this arm, when present; the token remains source evidence. */
      readonly armSeparatorAfter?: Token;
    }>;

export type ScannerMatchExpressionEvidence<Token> = Readonly<{
  readonly keyword: Token;
  readonly openingSubjectDelimiter: Token;
  readonly subject: readonly Token[];
  readonly closingSubjectDelimiter: Token;
  /** Any intervening source tokens between subject close and body open. */
  readonly betweenSubjectAndBody: readonly Token[];
  readonly openingBodyDelimiter: Token;
  /** Exact unpartitioned body source, retained to prove arm coverage. */
  readonly body: readonly Token[];
  readonly arms: readonly ScannerMatchArmEvidence<Token>[];
  readonly closingBodyDelimiter: Token;
  /** Tokens following this match expression, preserved for caller-level composition. */
  readonly remaining: readonly Token[];
}>;

export type ScannerMatchExpressionJudgment<Token> =
  | Readonly<{
      readonly kind: typeof SCANNER_MATCH_RESOLVED;
      readonly evidence: ScannerMatchExpressionEvidence<Token>;
    }>
  | Readonly<{ readonly kind: typeof SCANNER_MATCH_NOT_APPLICABLE }>
  | Readonly<{
      readonly kind: typeof SCANNER_MATCH_MALFORMED;
      readonly location: ScannerMatchEvidenceLocation<Token>;
      readonly reason: ScannerMatchMalformedReason;
      /** Lexical spelling is source evidence, not a semantic identity. */
      readonly expected: string;
      readonly actual: string;
    }>
  | Readonly<{
      readonly kind: typeof SCANNER_MATCH_CONTRACT_VIOLATION;
      readonly reason: ScannerMatchContractViolationReason;
    }>;

export type ScannerMatchExpressionQuery<Token> = Readonly<{
  /** Candidate suffix begins at the potential `match` keyword. */
  readonly tokens: readonly Token[];
  /** Returns the observed source spelling for structural token evidence. */
  readonly tokenValue: (token: Token) => string;
  /** Token identity comparison; spelling alone cannot prove source partition identity. */
  readonly sameToken: (left: Token, right: Token) => boolean;
  /** Canonical authority for delimiter matching and top-level token partitions. */
  readonly structure: ScannerTokenStructureInterface;
}>;

/**
 * Contract for resolving match-expression grammar into closed, source-backed
 * judgments. An implementation must reuse ScannerTokenStructureInterface for
 * delimiter and top-level partition evidence rather than inventing a second scanner.
 *
 * A resolved judgment is complete only when its source partitions reconstruct the
 * query token sequence exactly: keyword, subject delimiters and contents, tokens
 * between subject and body, body delimiters and contents, then remaining tokens.
 * Within the body, each arm source excludes its trailing arm comma; concatenating
 * each arm source with its optional armSeparatorAfter must reconstruct `body`.
 * A conditional arm source must reconstruct conditions, condition separators, the
 * exact fat-arrow token, and value. A default arm source must reconstruct its
 * default token, fat arrow, and value. A resolved body has at least one arm; each
 * conditional arm has at least one non-empty condition; every arm has exactly one
 * top-level fat-arrow token and a non-empty value. A default arm has no conditions,
 * and at most one default arm exists. Arm separators are not part of arm.source,
 * and a trailing body comma is preserved only as the final arm's separator evidence.
 * `sameToken` proves token identity; lexical spelling alone is insufficient because
 * distinct tokens may have equal spellings. Source malformedness is not a contract
 * violation: only violations of these output invariants use the latter.
 */
export interface ScannerMatchExpressionInterface {
  readonly resolve: <Token>(query: ScannerMatchExpressionQuery<Token>) => ScannerMatchExpressionJudgment<Token>;
}
