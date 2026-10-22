import { describe, expect, it } from 'vitest';
import { controllerPolicyActionScopeJudgmentAuthority } from './controllerPolicyActionScopeJudgmentAuthority';
import { createActionName } from './names';
import type { ControllerMethodAttributeScope } from './controller';
import type { ExpressionArguments } from './expression';

const emptyArguments: ExpressionArguments = Object.freeze({
  kind: 'expression_arguments',
  items: Object.freeze({ kind: 'empty' }),
});

const classScope: ControllerMethodAttributeScope = Object.freeze({ kind: 'class' });
const methodScope: ControllerMethodAttributeScope = Object.freeze({ kind: 'method' });

describe('Phase 2045 controller policy attribute action applicability', () => {
  it('keeps class-level authorization applicable to all actions', () => {
    expect(controllerPolicyActionScopeJudgmentAuthority.analyzeAttribute(
      classScope,
      createActionName('show'),
      emptyArguments,
    )).toEqual({ kind: 'all' });
  });

  it('binds method-level authorization to the canonical method action', () => {
    expect(controllerPolicyActionScopeJudgmentAuthority.analyzeAttribute(
      methodScope,
      createActionName('show'),
      emptyArguments,
    )).toEqual({
      kind: 'only',
      actions: {
        kind: 'cons',
        head: createActionName('show'),
        tail: { kind: 'empty' },
      },
    });
  });

  it('retains only/except judgment when method action identity is unavailable', () => {
    expect(controllerPolicyActionScopeJudgmentAuthority.analyzeAttribute(
      methodScope,
      undefined,
      emptyArguments,
    )).toEqual({ kind: 'all' });
  });
});
