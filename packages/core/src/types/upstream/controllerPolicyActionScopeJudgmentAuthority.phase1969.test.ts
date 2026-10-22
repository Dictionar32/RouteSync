import { describe, expect, it } from 'vitest';
import { controllerPolicyActionScopeJudgmentAuthority } from './controllerPolicyActionScopeJudgmentAuthority';
import { stringValue } from './names';
import type { ExpressionArguments } from './expression';

const source = Object.freeze({
  kind: 'source_span' as const,
  file: Object.freeze({ kind: 'source_file' as const, value: stringValue('Controller.php') }),
  start: Object.freeze({ kind: 'number_value' as const, value: 0 }),
  end: Object.freeze({ kind: 'number_value' as const, value: 1 }),
});

const argumentsWithOnly = (): ExpressionArguments => Object.freeze({
  kind: 'expression_arguments',
  items: Object.freeze({
    kind: 'cons',
    head: Object.freeze({
      kind: 'named',
      name: Object.freeze({ kind: 'expression_argument_name', value: stringValue('only') }),
      value: Object.freeze({
        kind: 'array',
        entries: Object.freeze({
          kind: 'cons',
          head: Object.freeze({
            kind: 'implicit',
            index: Object.freeze({ kind: 'number_value', value: 0 }),
            value: Object.freeze({ kind: 'literal', value: Object.freeze({ kind: 'string_literal', value: stringValue('index') }), source }),
            source,
          }),
          tail: Object.freeze({ kind: 'empty' }),
        }),
        source,
      }),
    }),
    tail: Object.freeze({ kind: 'empty' }),
  }),
});

describe('Phase 1969 controller policy action-scope judgment', () => {
  it('produces a typed only-scope from named source evidence', () => {
    const judgment = controllerPolicyActionScopeJudgmentAuthority.analyze(argumentsWithOnly());
    switch (judgment.kind) {
      case 'only':
        expect(judgment.actions).toEqual({ kind: 'cons', head: { kind: 'action_name', value: stringValue('index') }, tail: { kind: 'empty' } });
        return;
      case 'blocked':
      case 'all':
      case 'except':
      case 'only_except':
        throw new Error(`Unexpected policy scope: ${judgment.kind}`);
    }
  });

  it('defaults to all actions when no only/except argument exists', () => {
    const judgment = controllerPolicyActionScopeJudgmentAuthority.analyze(Object.freeze({ kind: 'expression_arguments', items: Object.freeze({ kind: 'empty' }) }));
    expect(judgment).toEqual({ kind: 'all' });
  });
  it('preserves simultaneous only and except arguments as a combined semantic scope', () => {
    const only = argumentsWithOnly();
    const onlyArgument = only.items.kind === 'cons' ? only.items.head : undefined;
    if (onlyArgument === undefined) throw new Error('Fixture must contain only argument');
    const exceptArgument = Object.freeze({
      kind: 'named' as const,
      name: Object.freeze({ kind: 'expression_argument_name' as const, value: stringValue('except') }),
      value: Object.freeze({
        kind: 'array' as const,
        entries: Object.freeze({
          kind: 'cons' as const,
          head: Object.freeze({
            kind: 'implicit' as const,
            index: Object.freeze({ kind: 'number_value' as const, value: 0 }),
            value: Object.freeze({ kind: 'literal' as const, value: Object.freeze({ kind: 'string_literal' as const, value: stringValue('store') }), source }),
            source,
          }),
          tail: Object.freeze({ kind: 'empty' as const }),
        }),
        source,
      }),
    });
    const judgment = controllerPolicyActionScopeJudgmentAuthority.analyze(Object.freeze({
      kind: 'expression_arguments' as const,
      items: Object.freeze({
        kind: 'cons' as const,
        head: onlyArgument,
        tail: Object.freeze({ kind: 'cons' as const, head: exceptArgument, tail: Object.freeze({ kind: 'empty' as const }) }),
      }),
    }));
    switch (judgment.kind) {
      case 'only_except':
        expect(judgment.only).toEqual({ kind: 'cons', head: { kind: 'action_name', value: stringValue('index') }, tail: { kind: 'empty' } });
        expect(judgment.except).toEqual({ kind: 'cons', head: { kind: 'action_name', value: stringValue('store') }, tail: { kind: 'empty' } });
        return;
      case 'blocked':
      case 'all':
      case 'only':
      case 'except':
        throw new Error(`Unexpected combined policy scope: ${judgment.kind}`);
    }
  });

});
