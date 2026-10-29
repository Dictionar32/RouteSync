import { describe, expect, test } from 'vitest';
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import { classifyPhpBlock } from '../../../frontend/php/astClassifier';
import { phpSourceTokenizer } from '../../../frontend/php/tokenizer';

describe('scanner assignment interface wiring phase 1445', () => {
  test('projects compound assignment through the upstream assignment contract', () => {
    const expression = LaravelSourceLexer.classifyAstValue('$count += 1');
    expect(expression.kind).toBe('assignment_expression');
    if (expression.kind !== 'assignment_expression') return;
    expect(expression.operator.kind).toBe('add');
    expect(expression.value.kind).toBe('literal');
  });

  test('projects reference assignment without leaking an operator index into AST', () => {
    const expression = LaravelSourceLexer.classifyAstValue('$copy = &$source');
    expect(expression.kind).toBe('assignment_expression');
    if (expression.kind !== 'assignment_expression') return;
    expect(expression.operator.kind).toBe('set');
    expect(expression.reference.kind).toBe('by_reference');
  });

  test('projects assignment statements after the same interface-based decomposition', () => {
    const block = classifyPhpBlock(phpSourceTokenizer.tokenize('$count = 1;'));
    expect(block.statements.map(statement => statement.kind)).toEqual(['assignment']);
  });
});
