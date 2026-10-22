import type { DelimitedTokenJudgment } from './scannerTokenStructureInterface';
import type { CallableArgumentJudgment, CallableCaptureJudgment, CallableListJudgment, CallableParameterJudgment } from './scannerCallableListInterface';
import type { StatementSequenceResolution } from './scannerStatementSequenceInterface';
import type { ScannerConditionalStatementJudgment } from './scannerConditionalStatementInterface';
import type { ScannerLoopControl, ScannerLoopStatementJudgment } from './scannerLoopStatementInterface';
import type { ScannerSwitchStatementJudgment } from './scannerSwitchStatementInterface';
import type { AssignmentPartsJudgment } from './scannerAssignmentPartsInterface';
import type { AssignmentTargetJudgment } from './scannerAssignmentTargetInterface';

/**
 * Source-level AST failure evidence that must survive the legacy parser boundary.
 * This is an ADT over the upstream judgment, not a replacement classifier.
 */
export type ScannerAstSourceFailureJudgment<Token> =
  | Readonly<{
      readonly kind: 'malformed_array_access_delimiter';
      readonly judgment: Extract<DelimitedTokenJudgment<Token>, { readonly kind: 'malformed' }>;
    }>
  | Readonly<{
      readonly kind: 'malformed_callable_parameter_list';
      readonly judgment: Extract<CallableParameterJudgment<Token>, { readonly kind: 'malformed' }>;
    }>
  | Readonly<{
      readonly kind: 'callable_parameter_contract_violation';
      readonly judgment: Extract<CallableParameterJudgment<Token>, { readonly kind: 'contract_violation' }>;
    }>
  | Readonly<{
      readonly kind: 'malformed_callable_capture_delimiter';
      readonly judgment: Exclude<DelimitedTokenJudgment<Token>, { readonly kind: 'matched' }>;
    }>
  | Readonly<{
      readonly kind: 'malformed_callable_capture_list';
      readonly judgment: Extract<CallableCaptureJudgment<Token>, { readonly kind: 'malformed' }>;
    }>
  | Readonly<{
      readonly kind: 'callable_capture_contract_violation';
      readonly judgment: Extract<CallableCaptureJudgment<Token>, { readonly kind: 'contract_violation' }>;
    }>
  | Readonly<{
      readonly kind: 'malformed_callable_argument_list';
      readonly judgment: Extract<CallableListJudgment<Token>, { readonly kind: 'malformed' }>;
    }>
  | Readonly<{
      readonly kind: 'callable_argument_list_contract_violation';
      readonly judgment: Extract<CallableListJudgment<Token>, { readonly kind: 'contract_violation' }>;
    }>
  | Readonly<{
      readonly kind: 'malformed_callable_argument';
      readonly judgment: Extract<CallableArgumentJudgment<Token>, { readonly kind: 'malformed' }>;
    }>
  | Readonly<{
      readonly kind: 'callable_argument_contract_violation';
      readonly judgment: Extract<CallableArgumentJudgment<Token>, { readonly kind: 'contract_violation' }>;
    }>
  | Readonly<{
      readonly kind: 'malformed_statement_sequence';
      readonly judgment: Extract<StatementSequenceResolution<unknown>, { readonly kind: 'malformed' }>;
    }>
  | Readonly<{
      readonly kind: 'statement_sequence_contract_violation';
      readonly judgment: Extract<StatementSequenceResolution<unknown>, { readonly kind: 'contract_violation' }>;
    }>
  | Readonly<{
      readonly kind: 'malformed_conditional_statement';
      readonly judgment: Extract<ScannerConditionalStatementJudgment<Token>, { readonly kind: 'malformed' }>;
    }>
  | Readonly<{
      readonly kind: 'malformed_loop_statement';
      readonly control: ScannerLoopControl;
      readonly judgment: Extract<ScannerLoopStatementJudgment<Token>, { readonly kind: 'malformed' }>;
    }>
  | Readonly<{
      readonly kind: 'malformed_switch_statement';
      readonly judgment: Extract<ScannerSwitchStatementJudgment<Token>, { readonly kind: 'malformed' }>;
    }>
  | Readonly<{
      readonly kind: 'malformed_assignment_parts';
      readonly judgment: Extract<AssignmentPartsJudgment<unknown, unknown, string, Token>, { readonly kind: 'malformed' }>;
    }>
  | Readonly<{
      readonly kind: 'assignment_parts_contract_violation';
      readonly judgment: Extract<AssignmentPartsJudgment<unknown, unknown, string, Token>, { readonly kind: 'contract_violation' }>;
    }>
  | Readonly<{
      readonly kind: 'malformed_assignment_target';
      readonly judgment: Extract<AssignmentTargetJudgment<Token, unknown>, { readonly kind: 'malformed' }>;
    }>
  | Readonly<{
      readonly kind: 'assignment_target_contract_violation';
      readonly judgment: Extract<AssignmentTargetJudgment<Token, unknown>, { readonly kind: 'contract_violation' }>;
    }>;

/** Typed boundary for parser APIs that still expose AST values instead of a result ADT. */
export interface ScannerAstSourceFailureInterface<Token> {
  readonly kind: 'scanner_ast_source_failure';
  readonly failure: ScannerAstSourceFailureJudgment<Token>;
}
