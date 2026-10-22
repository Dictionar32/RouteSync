import { describe, expect, test } from 'vitest';
import { LaravelSourceLexer } from '../../LaravelSourceLexer';

describe('scanner expression structural contract phase 1428', () => {
  test('selects structural expression before constructing the AST', () => {
    const expression = LaravelSourceLexer.classifyAstValue('$a + $b * $c');
    expect(expression.kind).toBe('binary_expression');
    if (expression.kind !== 'binary_expression') return;
    expect(expression.operator.kind).toBe('addition');
    expect(expression.right.kind).toBe('binary_expression');
    if (expression.right.kind !== 'binary_expression') return;
    expect(expression.right.operator.kind).toBe('multiplication');
  });

  test('preserves right-associative null-coalescing structure', () => {
    const expression = LaravelSourceLexer.classifyAstValue('$a ?? $b ?? $c');
    expect(expression.kind).toBe('null_coalesce');
    if (expression.kind !== 'null_coalesce') return;
    expect(expression.right.kind).toBe('null_coalesce');
  });

  test('projects call structure into the PHP AST only after candidate resolution', () => {
    const expression = LaravelSourceLexer.classifyAstValue('resolveRoute($request)');
    expect(expression.kind).toBe('function_call');
    if (expression.kind !== 'function_call') return;
    expect(expression.functionName.name).toBe('resolveRoute');
    expect(expression.arguments).toHaveLength(1);
  });

  test('projects array access structure without using the old candidate AST builder', () => {
    const expression = LaravelSourceLexer.classifyAstValue('$items[$index]');
    expect(expression.kind).toBe('array_access');
  });
});
