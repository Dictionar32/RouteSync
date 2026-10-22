import { describe, expect, test } from 'vitest';
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import { classifyPhpBlock } from '../../lexer/astClassifier';
import { phpSourceTokenizer } from '../../lexer/tokenizer';

describe('scanner expression partition wiring phase 1442', () => {
  test('projects keyed array entries from before/after evidence partitions', () => {
    const expression = LaravelSourceLexer.classifyAstValue("['id' => $id, 'name' => $name]");
    expect(expression.kind).toBe('nested_array');
    if (expression.kind !== 'nested_array') return;
    expect(expression.entries.map(entry => entry.kind)).toEqual(['keyed', 'keyed']);
  });

  test('projects match arms from the operator evidence partition', () => {
    const expression = LaravelSourceLexer.classifyAstValue("match ($status) { 'paid' => 1, default => 0 }");
    expect(expression.kind).toBe('match_expression');
    if (expression.kind !== 'match_expression') return;
    expect(expression.arms.map(arm => arm.kind)).toEqual(['conditional', 'default']);
  });

  test('projects instanceof without a numeric operator offset', () => {
    const expression = LaravelSourceLexer.classifyAstValue('$value instanceof Product');
    expect(expression.kind).toBe('instance_of');
  });

  test('projects foreach iterable and key/value binding from the as partition', () => {
    const block = classifyPhpBlock(phpSourceTokenizer.tokenize('foreach ($items as $key => $item) { $value = $item; }'));
    expect(block.statements.map(statement => statement.kind)).toEqual(['foreach_statement']);
    const statement = block.statements[0];
    if (statement?.kind !== 'foreach_statement') return;
    expect(statement.target.kind).toBe('key_value');
  });
});
