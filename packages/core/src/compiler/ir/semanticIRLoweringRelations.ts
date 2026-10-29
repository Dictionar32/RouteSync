/**
 * Domain-owned IR lowering rules.
 *
 * Lowering rules are typed domain knowledge. Lookup returns an explicit
 * judgment, and callers continue from that judgment instead of depending on
 * the deleted generic relation foundation.
 */

export type IRLoweringRelation = 'semantic_kind' | 'lowering_operation';

export interface IRLoweringRule {
  readonly kind: 'ir_lowering_rule';
  readonly id: string;
  readonly sourceKind: string;
  readonly operation: string;
}

export interface IRLoweringRuleHandlers<T> {
  readonly found: (rule: IRLoweringRule) => T;
  readonly missing: (sourceKind: string) => T;
}

export type IRLoweringRuleLookup =
  | {
      readonly kind: 'ir_lowering_rule_found';
      readonly rule: IRLoweringRule;
      readonly continueWith: <T>(handlers: IRLoweringRuleHandlers<T>) => T;
    }
  | {
      readonly kind: 'ir_lowering_rule_missing';
      readonly sourceKind: string;
      readonly continueWith: <T>(handlers: IRLoweringRuleHandlers<T>) => T;
    };

export interface IRLoweringRuleSetInterface {
  readonly rules: readonly IRLoweringRule[];
  readonly lookup: (sourceKind: string) => IRLoweringRuleLookup;
}

export interface IRLoweringOperationsInterface {
  readonly rule: (id: string, sourceKind: string, operation: string) => IRLoweringRule;
  readonly ruleSet: (rules: readonly IRLoweringRule[]) => IRLoweringRuleSetInterface;
  readonly resolve: (sourceKind: string, rules: readonly IRLoweringRule[]) => string;
}

const rule = (id: string, sourceKind: string, operation: string): IRLoweringRule =>
  Object.freeze({ kind: 'ir_lowering_rule', id, sourceKind, operation });

const ruleSet = (rules: readonly IRLoweringRule[]): IRLoweringRuleSetInterface => {
  const ownedRules = Object.freeze([...rules]);
  return Object.freeze({
    rules: ownedRules,
    lookup: (sourceKind: string): IRLoweringRuleLookup => {
      const found = ownedRules.find(candidate => candidate.sourceKind === sourceKind);
      return found === undefined
        ? Object.freeze({
            kind: 'ir_lowering_rule_missing' as const,
            sourceKind,
            continueWith: <T>(handlers: IRLoweringRuleHandlers<T>): T => handlers.missing(sourceKind),
          })
        : Object.freeze({
            kind: 'ir_lowering_rule_found' as const,
            rule: found,
            continueWith: <T>(handlers: IRLoweringRuleHandlers<T>): T => handlers.found(found),
          });
    },
  });
};

const resolve = (sourceKind: string, rules: readonly IRLoweringRule[]): string =>
  ruleSet(rules).lookup(sourceKind).continueWith({
    found: matched => matched.operation,
    missing: missingKind => { throw Error(`No declarative lowering operation for ${missingKind}`); },
  });

const kindRules = (prefix: string, kinds: readonly string[]): readonly IRLoweringRule[] =>
  Object.freeze(kinds.map(kind => rule(`${prefix}-${kind}`, kind, kind)));

export const irLoweringOperations: IRLoweringOperationsInterface = Object.freeze({
  rule,
  ruleSet,
  resolve,
});

export const CONTRACT_TYPE_LOWERING_RULES: readonly IRLoweringRule[] = Object.freeze([
  ...kindRules('contract-type', ['primitive', 'reference', 'optional', 'nullable', 'collection', 'object', 'union', 'literal', 'unknown', 'intersection']),
]);

export const RESPONSE_ANALYSIS_LOWERING_RULES: readonly IRLoweringRule[] = Object.freeze([
  ...kindRules('response-analysis', ['resource', 'model', 'object', 'primitive', 'binary', 'empty', 'redirect']),
]);

export const RESPONSE_FIELD_NORMALIZATION_RULES: readonly IRLoweringRule[] = Object.freeze([
  rule('response-field-primitive', 'primitive', 'primitive'),
  rule('response-field-object', 'object', 'object'),
  rule('response-field-array', 'array', 'array'),
  rule('response-field-variable', 'variable', 'primitive'),
  rule('response-field-property-access', 'property_access', 'primitive'),
]);

export const RESPONSE_RESOLVED_TYPE_RULES: readonly IRLoweringRule[] = Object.freeze([
  rule('response-resolved-reference', 'reference', 'reference'),
  rule('response-resolved-type', 'type', 'type'),
  rule('response-resolved-unresolved', 'unresolved', 'unresolved'),
]);

export const NULLABLE_WRAPPER_RULES: readonly IRLoweringRule[] = Object.freeze([
  rule('nullable-wrapper-nullable', 'nullable', 'nullable_wrapper'),
  rule('nullable-wrapper-other', 'other', 'not_nullable_wrapper'),
]);

export const RESPONSE_FIELD_PRESENCE_RULES: readonly IRLoweringRule[] = Object.freeze([
  rule('response-field-present', 'present', 'present'),
  rule('response-field-absent', 'absent', 'absent'),
]);
