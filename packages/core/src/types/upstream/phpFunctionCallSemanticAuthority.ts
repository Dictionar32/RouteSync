import type {
  PhpFunctionCallSemanticAuthorityInterface,
  PhpFunctionCallSemanticInput,
  PhpFunctionCallSemanticJudgment,
} from './phpFunctionCallSemanticAuthorityInterface';
import { phpFunctionInvocationSemanticAuthority } from './phpFunctionInvocationSemanticAuthority';

/**
 * Transitional facade only: the invocation authority owns the closed judgment.
 * This module deliberately contains no name matching, builtin catalog, or reasoning.
 * Scanner consumers must migrate from raw FunctionName evidence to resolution input.
 */
const derive = (input: PhpFunctionCallSemanticInput): PhpFunctionCallSemanticJudgment =>
  phpFunctionInvocationSemanticAuthority.derive(input);

export const phpFunctionCallSemanticAuthority: PhpFunctionCallSemanticAuthorityInterface = Object.freeze({
  kind: 'php_function_call_semantic_authority',
  invocationAuthority: phpFunctionInvocationSemanticAuthority,
  derive,
});
