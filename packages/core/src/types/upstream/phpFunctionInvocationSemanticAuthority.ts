import type { PhpFunctionInvocationSemanticAuthorityInterface, PhpFunctionInvocationSemanticInput, PhpFunctionInvocationSemanticJudgment } from './phpFunctionInvocationSemanticAuthorityInterface';
import { PHP_FUNCTION_INVOCATION_SEMANTIC_CONTRACT } from './phpFunctionInvocationSemanticAuthorityInterface';

/**
 * Closes an invocation around the upstream name-resolution judgment.
 * It does not perform lookup, reclassify the target, or construct a downstream AST.
 */
const derive = (input: PhpFunctionInvocationSemanticInput): PhpFunctionInvocationSemanticJudgment => {
  const resolution = input.resolution;

  switch (resolution.kind) {
    case 'function_name_ambiguous':
    case 'function_name_unresolved':
    case 'function_name_deferred':
      return Object.freeze({
        kind: 'php_function_invocation_unresolved',
        resolution,
        arguments: input.arguments,
      });
    case 'function_name_resolved':
      return Object.freeze({
        kind: 'php_function_invocation_resolved',
        resolution,
        arguments: input.arguments,
      });
  }
};

export const phpFunctionInvocationSemanticAuthority: PhpFunctionInvocationSemanticAuthorityInterface = Object.freeze({
  kind: 'php_function_invocation_semantic_authority',
  contract: PHP_FUNCTION_INVOCATION_SEMANTIC_CONTRACT,
  derive,
});
