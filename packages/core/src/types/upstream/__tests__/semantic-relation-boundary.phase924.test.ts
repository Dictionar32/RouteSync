import { describe, expect, it } from 'vitest';
import {
  isControllerActionPolicyRelation,
  isStructuralSemanticRelation,
} from '../semanticReferences';
import type { SemanticRelation } from '../semanticReferences';

const policy = {
  kind: 'controller_action_middleware_policy' as const,
  controller: {
    kind: 'controller_name' as const,
    value: { kind: 'string_value' as const, value: 'OrderController' },
  },
  action: {
    kind: 'action_name' as const,
    value: { kind: 'string_value' as const, value: 'store' },
  },
  middleware: {
    name: {
      kind: 'middleware_name' as const,
      value: { kind: 'string_value' as const, value: 'auth' },
    },
    parameters: [],
  },
  source: [],
  provenance: 'controller_method' as const,
  inheritedFrom: [],
};

const structural: SemanticRelation = {
  kind: 'controller_dependency',
  controller: policy.controller,
  dependency: {
    kind: 'service_reference',
    name: { kind: 'class_name', value: { kind: 'string_value', value: 'OrderService' } },
  },
};

describe('Phase 924 semantic relation boundary', () => {
  it('keeps policy relations outside the structural graph-edge relation lane', () => {
    expect(isControllerActionPolicyRelation(policy)).toBe(true);
    expect(isStructuralSemanticRelation(policy)).toBe(false);
    expect(isControllerActionPolicyRelation(structural)).toBe(false);
    expect(isStructuralSemanticRelation(structural)).toBe(true);
  });
});
