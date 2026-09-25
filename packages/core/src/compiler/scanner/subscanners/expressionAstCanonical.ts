import type { ExpressionAst, ExpressionOrigin, ExpressionSurface } from '../../../types/upstream/ast';
import type { Expression } from '../../../types/upstream/expression';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { PhpAstValue } from '../lexer/phpAstExpressionTypes';
import { createSourceFile } from '../../../types/upstream/names';

export function expressionSurface(value: PhpAstValue): ExpressionSurface {
  switch (value.kind) {
    case 'literal': return { kind: 'php_literal' };
    case 'interpolated_string': return { kind: 'php_interpolated_string' };
    case 'variable_reference': return { kind: 'php_variable' };
    case 'magic_constant': return { kind: 'php_magic_constant' };
    case 'constant_reference': return { kind: 'php_constant_reference' };
    case 'property_access': return value.access.kind === 'nullsafe' ? { kind: 'php_nullsafe_property_access' } : { kind: 'php_property_access' };
    case 'method_chain': return value.access.kind === 'nullsafe' ? { kind: 'php_nullsafe_method_call' } : { kind: 'php_method_call' };
    case 'static_call': return { kind: 'php_static_call' };
    case 'function_call': return { kind: 'php_function_call' };
    case 'callable_call': return { kind: 'php_function_call' };
    case 'nested_array': return { kind: 'php_array' };
    case 'binary_expression': return { kind: 'php_binary' };
    case 'unary_expression': return { kind: 'php_unary' };
    case 'ternary_expression': return { kind: 'php_ternary' };
    case 'short_ternary': return { kind: 'php_short_ternary' };
    case 'null_coalesce': return { kind: 'php_coalesce' };
    case 'cast_expression': return { kind: 'php_cast' };
    case 'closure': return { kind: 'php_closure' };
    case 'arrow_function': return { kind: 'php_arrow_function' };
    case 'match_expression': return { kind: 'php_match' };
    case 'class_reference': return { kind: 'php_class_reference' };
    case 'class_constant': return { kind: 'php_class_constant' };
    case 'construct': return { kind: 'php_constructor' };
    case 'assignment_expression': return { kind: 'php_assignment' };
    case 'dynamic_construct': return { kind: 'php_constructor' };
    case 'anonymous_class_construct': return { kind: 'php_anonymous_class_constructor' };
    case 'instance_of': return { kind: 'php_instance_of' };
    case 'array_access': return { kind: 'php_array_access' };
    case 'unsupported': return { kind: 'php_unsupported' };
  }
}

export function expressionAstFromPhpAst(
  value: PhpAstValue,
  expression: Expression,
  origin: ExpressionOrigin,
  file: string,
): ExpressionAst {
  const source: SourceSpan = {
    kind: 'source_span',
    file: createSourceFile(file),
    start: { kind: 'number_value', value: value.source.startOffset },
    end: { kind: 'number_value', value: value.source.endOffset },
  };
  return Object.freeze({
    kind: 'expression_ast',
    expression,
    origin,
    surface: expressionSurface(value),
    source,
  });
}

function expressionSurfaceFromStaticAction(action: import('../../../types/upstream/expression').StaticMethodAction): ExpressionSurface {
  switch (action.kind) {
    case 'database_raw': return { kind: 'php_database_raw' };
    default: return { kind: 'php_static_call' };
  }
}

export function expressionSurfaceFromExpression(expression: Expression): ExpressionSurface {
  switch (expression.kind) {
    case 'literal': return { kind: 'php_literal' };
    case 'interpolated_string': return { kind: 'php_interpolated_string' };
    case 'variable': return { kind: 'php_variable' };
    case 'magic_constant': return { kind: 'php_magic_constant' };
    case 'constant_reference': return { kind: 'php_constant_reference' };
    case 'property': return { kind: 'php_property_access' };
    case 'nullsafe_property': return { kind: 'php_nullsafe_property_access' };
    case 'relation': case 'method': return { kind: 'php_method_call' };
    case 'nullsafe_method': return { kind: 'php_nullsafe_method_call' };
    case 'static_method': return expressionSurfaceFromStaticAction(expression.action);
    case 'builtin': case 'call': case 'callable_call': return { kind: 'php_function_call' };
    case 'sql': return { kind: 'php_database_raw' };
    case 'cast': return { kind: 'php_cast' };
    case 'binary': return { kind: 'php_binary' };
    case 'unary': return { kind: 'php_unary' };
    case 'conditional': return { kind: 'php_ternary' };
    case 'short_conditional': return { kind: 'php_short_ternary' };
    case 'coalesce': return { kind: 'php_coalesce' };
    case 'index': return { kind: 'php_array_access' };
    case 'array': return { kind: 'php_array' };
    case 'object': return { kind: 'php_array' };
    case 'match': return { kind: 'php_match' };
    case 'model_reference': case 'resource_reference': return { kind: 'php_class_reference' };
    case 'closure': return { kind: 'php_closure' };
    case 'arrow_function': return { kind: 'php_arrow_function' };
    case 'class_reference': return { kind: 'php_class_reference' };
    case 'class_constant': return { kind: 'php_class_constant' };
    case 'construct': return { kind: 'php_constructor' };
    case 'assignment_expression': return { kind: 'php_assignment' };
    case 'dynamic_construct': return { kind: 'php_constructor' };
    case 'anonymous_class': return { kind: 'php_anonymous_class_constructor' };
    case 'instance_of': return { kind: 'php_instance_of' };
    case 'unsupported_expression': return { kind: 'php_unsupported' };
  }
}

export function expressionAstFromExpression(
  expression: Expression,
  origin: ExpressionOrigin,
): ExpressionAst {
  return Object.freeze({
    kind: 'expression_ast',
    expression,
    origin,
    surface: expressionSurfaceFromExpression(expression),
    source: expression.source,
  });
}
