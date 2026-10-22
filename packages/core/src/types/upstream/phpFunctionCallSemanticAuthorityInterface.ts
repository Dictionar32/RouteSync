import type {
  PhpFunctionInvocationSemanticAuthorityInterface,
  PhpFunctionInvocationSemanticInput,
  PhpFunctionInvocationSemanticJudgment,
} from './phpFunctionInvocationSemanticAuthorityInterface';

/**
 * The function-call semantic result is the closed invocation judgment itself.
 * Expression/AST projection is a later stage and must not re-resolve a callee.
 */
export type PhpFunctionCallSemanticJudgment = PhpFunctionInvocationSemanticJudgment;

/**
 * Function-call derivation accepts only a completed upstream name-resolution judgment.
 * Raw short names are source evidence, not a semantic target.
 */
export type PhpFunctionCallSemanticInput = PhpFunctionInvocationSemanticInput;

/**
 * Compatibility boundary for callers migrating to the canonical invocation authority.
 * This interface delegates a completed invocation input; it owns no name lookup,
 * builtin catalog, Laravel-helper classification, or expression construction.
 */
export interface PhpFunctionCallSemanticAuthorityInterface {
  readonly kind: 'php_function_call_semantic_authority';
  readonly invocationAuthority: PhpFunctionInvocationSemanticAuthorityInterface;
  readonly derive: (input: PhpFunctionCallSemanticInput) => PhpFunctionCallSemanticJudgment;
}
