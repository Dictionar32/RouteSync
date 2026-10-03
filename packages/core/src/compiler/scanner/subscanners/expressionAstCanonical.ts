import { createAstJudgment, type ExpressionAst, type ExpressionOrigin, type ExpressionSurface } from '../../../types/upstream/ast';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { Expression } from '../../../types/upstream/expression';
import type { PhpAstValue } from '../lexer/phpAstExpressionTypes';
import { createSourceFile } from '../../../types/upstream/names';
import { stringValue } from '../../../types/upstream/names';
import { relationEqual } from '../../../semantic/kernel/semanticRelations';
import { relationGate, relationLookup, relationOptionFold, relationVariantValue } from '../../../semantic/kernel/relationalSequence';

const expressionSurfaces: readonly (readonly [string, ExpressionSurface])[] = Object.freeze([
  ['literal', { kind: 'php_literal' }],
  ['resource_single', { kind: 'php_resource_reference' }],
  ['resource_collection', { kind: 'php_resource_reference' }],
  ['interpolated_string', { kind: 'php_interpolated_string' }],
  ['variable_reference', { kind: 'php_variable' }],
  ['magic_constant', { kind: 'php_magic_constant' }],
  ['constant_reference', { kind: 'php_constant_reference' }],
  ['static_call', { kind: 'php_static_call' }],
  ['function_call', { kind: 'php_function_call' }],
  ['callable_call', { kind: 'php_function_call' }],
  ['nested_array', { kind: 'php_array' }],
  ['binary_expression', { kind: 'php_binary' }],
  ['unary_expression', { kind: 'php_unary' }],
  ['ternary_expression', { kind: 'php_ternary' }],
  ['short_ternary', { kind: 'php_short_ternary' }],
  ['null_coalesce', { kind: 'php_coalesce' }],
  ['cast_expression', { kind: 'php_cast' }],
  ['closure', { kind: 'php_closure' }],
  ['arrow_function', { kind: 'php_arrow_function' }],
  ['match_expression', { kind: 'php_match' }],
  ['class_reference', { kind: 'php_class_reference' }],
  ['class_constant', { kind: 'php_class_constant' }],
  ['construct', { kind: 'php_constructor' }],
  ['assignment_expression', { kind: 'php_assignment' }],
  ['dynamic_construct', { kind: 'php_constructor' }],
  ['anonymous_class_construct', { kind: 'php_anonymous_class_constructor' }],
  ['instance_of', { kind: 'php_instance_of' }],
  ['array_access', { kind: 'php_array_access' }],
  ['unsupported', { kind: 'php_unsupported' }],
]);

export function expressionSurface(value: PhpAstValue): ExpressionSurface {
  return relationGate(relationEqual(value.kind, 'property_access'),
    () => {
      const property = relationVariantValue(value, 'property_access');
      return relationGate(relationEqual(property.access.kind, 'nullsafe'), () => ({ kind: 'php_nullsafe_property_access' }), () => ({ kind: 'php_property_access' }));
    },
    () => relationGate(relationEqual(value.kind, 'method_chain'),
      () => {
        const method = relationVariantValue(value, 'method_chain');
        return relationGate(relationEqual(method.access.kind, 'nullsafe'), () => ({ kind: 'php_nullsafe_method_call' }), () => ({ kind: 'php_method_call' }));
      },
      () => relationOptionFold(relationLookup(expressionSurfaces, value.kind), () => ({ kind: 'php_unsupported' }), surface => surface)));
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
  return createAstJudgment({
    kind: 'expression_ast',
    semantic: expression,
    surface: expressionSurface(value),
    origin,
    source,
    rule: { kind: 'ast_rule', value: stringValue('php-expression-to-upstream-expression') },
    witness: { kind: 'ast_witness', value: stringValue(value.kind) },
  });
}

