import { describe, expect, it } from 'vitest';
import { controllerPolicyActionScopeJudgmentAuthority } from './controllerPolicyActionScopeJudgmentAuthority';
import { stringValue } from './names';
import type { Expression, ExpressionArgument, ExpressionArguments } from './expression';
import type { Sequence } from './collections';

const source = Object.freeze({
  kind: 'source_span' as const,
  file: Object.freeze({ kind: 'source_file' as const, value: stringValue.create('Controller.php') }),
  start: Object.freeze({ kind: 'number_value' as const, value: 0 }),
  end: Object.freeze({ kind: 'number_value' as const, value: 1 }),
});

const named = (name: 'only' | 'except', value: Expression): ExpressionArgument => Object.freeze({
  kind: 'named',
  name: Object.freeze({ kind: 'expression_argument_name', value: stringValue.create(name) }),
  value,
});

const argumentsOf = (items: readonly ExpressionArgument[]): ExpressionArguments => Object.freeze({
  kind: 'expression_arguments',
  items: items.reduceRight<Sequence<ExpressionArgument>>(
    (tail, head) => Object.freeze({ kind: 'cons', head, tail }),
    Object.freeze({ kind: 'empty' }),
  ),
});

const dynamicMethods = (): Expression => Object.freeze({
  kind: 'variable',
  name: Object.freeze({ kind: 'variable_name', value: stringValue.create('methods') }),
  source,
});

describe('Phase 1971 closed controller policy scope judgment', () => {
  it('blocks dynamic only expressions instead of silently resolving an empty scope', () => {
    const judgment = controllerPolicyActionScopeJudgmentAuthority.analyze(argumentsOf([named('only', dynamicMethods())]));
    expect(judgment.kind).toBe('blocked');
    switch (judgment.kind) {
      case 'blocked': expect(judgment.reason.kind).toBe('unsupported_only_expression'); return;
      case 'all':
      case 'only':
      case 'except':
      case 'only_except': throw new Error('Dynamic only expression must block the judgment');
    }
  });

  it('blocks duplicate only arguments while retaining both source arguments', () => {
    const first = named('only', dynamicMethods());
    const second = named('only', dynamicMethods());
    const judgment = controllerPolicyActionScopeJudgmentAuthority.analyze(argumentsOf([first, second]));
    expect(judgment.kind).toBe('blocked');
    switch (judgment.kind) {
      case 'blocked':
        switch (judgment.reason.kind) {
          case 'duplicate_only_argument': expect(judgment.reason.arguments).toHaveLength(2); return;
          case 'duplicate_except_argument':
          case 'unsupported_only_expression':
          case 'unsupported_except_expression':
          case 'unsupported_action_array_entry':
          case 'unsupported_unpacked_arguments':
          case 'scope_argument_inventory_inconsistent': throw new Error('Unexpected blocking reason');
        }
        return;
      case 'all':
      case 'only':
      case 'except':
      case 'only_except': throw new Error('Duplicate only arguments must block the judgment');
    }
  });

  it('preserves a resolved empty array as a deliberate empty scope', () => {
    const emptyArray: Expression = Object.freeze({ kind: 'array', entries: Object.freeze({ kind: 'empty' }), source });
    const judgment = controllerPolicyActionScopeJudgmentAuthority.analyze(argumentsOf([named('only', emptyArray)]));
    expect(judgment).toEqual({ kind: 'only', actions: { kind: 'empty' } });
  });

  it('blocks unpacked argument evidence because it may supply hidden scope constraints', () => {
    const unpacked: ExpressionArgument = Object.freeze({ kind: 'unpacked', value: dynamicMethods() });
    const judgment = controllerPolicyActionScopeJudgmentAuthority.analyze(argumentsOf([unpacked]));
    expect(judgment.kind).toBe('blocked');
    switch (judgment.kind) {
      case 'blocked': expect(judgment.reason.kind).toBe('unsupported_unpacked_arguments'); return;
      case 'all':
      case 'only':
      case 'except':
      case 'only_except': throw new Error('Unpacked arguments must block the judgment');
    }
  });
});
