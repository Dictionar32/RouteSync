import type { RouteConstraintFact, RouteConstraintMatcher } from '../../../../types/upstream/routeConstraints';
import { createEnumName } from '../../../../types/upstream/names';
import type { StringValue } from '../../../../types/upstream/valueObjects';
import { cardinalityOf, fromOptional } from '../../../../types/upstream/presence';

type ConstraintResolver = (fact: RouteConstraintFact) => RouteConstraintMatcher;

const unresolved = (fact: RouteConstraintFact, reason: 'missing_value' | 'missing_values'): RouteConstraintMatcher =>
  ({ kind: 'unresolved', method: fact.method, reason });

const where = (fact: RouteConstraintFact): RouteConstraintMatcher => {
  const handlers = Object.freeze({
    absent: () => unresolved(fact, 'missing_value'),
    present: (value: Extract<RouteConstraintFact['value'], { kind: 'present' }>) => ({ kind: 'regex' as const, pattern: value.value }),
  });
  return handlers[fact.value.kind](fact.value as never);
};

const helper = (kind: Extract<RouteConstraintMatcher, { kind: 'number' | 'alpha' | 'alpha_numeric' | 'uuid' | 'ulid' }>['kind']) =>
  (): RouteConstraintMatcher => ({ kind });

const whereIn = (fact: RouteConstraintFact): RouteConstraintMatcher => {
  const handlers = Object.freeze({
    absent: () => unresolved(fact, 'missing_values'),
    present: (values: Extract<RouteConstraintFact['values'], { kind: 'present' }>) => {
      const cardinality = cardinalityOf(values.value);
      const cardinalityHandlers = Object.freeze({
        empty: () => unresolved(fact, 'missing_values'),
        non_empty: () => ({ kind: 'in' as const, values: resolveAllowedValues(values.value) }),
      });
      return cardinalityHandlers[cardinality]();
    },
  });
  return handlers[fact.values.kind](fact.values as never);
};

export const CONSTRAINT_RESOLVER_CATALOG: Readonly<Record<RouteConstraintFact['method'], ConstraintResolver>> = Object.freeze({
  where,
  whereNumber: helper('number'),
  whereAlpha: helper('alpha'),
  whereAlphaNumeric: helper('alpha_numeric'),
  whereUuid: helper('uuid'),
  whereUlid: helper('ulid'),
  whereIn,
});

function resolveAllowedValues(values: readonly StringValue[]): readonly import('../../../../types/upstream/routeConstraints').RouteConstraintAllowedValue[] {
  return Object.freeze(values.map(resolveAllowedValueExpression));
}

const resolveAllowedValueExpression = (value: StringValue) => {
  const expression = value.value.trim();
  const match = expression.match(/^(?<enumName>[A-Za-z_][A-Za-z0-9_\\]*)::cases\(\)$/);
  const enumName = fromOptional(match?.groups?.enumName);
  const handlers = Object.freeze({
    absent: () => ({ kind: 'literal' as const, value }),
    present: (name: Extract<typeof enumName, { kind: 'present' }>) => ({ kind: 'enum_cases' as const, enum: createEnumName(name.value) }),
  });
  return handlers[enumName.kind](enumName as never);
};
