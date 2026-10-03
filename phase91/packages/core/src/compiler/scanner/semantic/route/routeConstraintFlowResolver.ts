import { createEnumName } from '../../../../types/upstream/names';
import type {
  RouteConstraintAllowedValue,
  RouteConstraintContract,
  RouteConstraintFact,
  RouteConstraintFlow,
  RouteConstraintMatcher,
} from '../../../../types/upstream/routeConstraints';

export interface RouteConstraintFlowInput {
  readonly facts: readonly RouteConstraintFact[];
}

/** Laravel-aware semantic resolver. AST is deliberately absent from this boundary. */
export function resolveRouteConstraintFlow(
  input: RouteConstraintFlowInput,
): RouteConstraintFlow {
  const contracts = input.facts.map(resolveConstraintFact);
  const route = contracts.filter(item => item.source.kind === 'route');
  return Object.freeze({
    kind: 'route_constraint_flow',
    route: Object.freeze(route),
    effective: Object.freeze([...contracts]),
  });
}

function resolveConstraintFact(fact: RouteConstraintFact): RouteConstraintContract {
  return Object.freeze({ parameter: fact.parameter, matcher: matcherFromFact(fact), source: fact.source });
}

const MATCHER_BY_METHOD = Object.freeze({
  whereNumber: () => ({ kind: 'number' as const }),
  whereAlpha: () => ({ kind: 'alpha' as const }),
  whereAlphaNumeric: () => ({ kind: 'alpha_numeric' as const }),
  whereUuid: () => ({ kind: 'uuid' as const }),
  whereUlid: () => ({ kind: 'ulid' as const }),
});

function matcherFromFact(fact: RouteConstraintFact): RouteConstraintMatcher {
  const where = {
    absent: () => ({ kind: 'unresolved' as const, method: fact.method, reason: 'missing_value' as const }),
    present: (value: Extract<typeof fact.value, { kind: 'present' }>) => ({ kind: 'regex' as const, pattern: value.value }),
  };
  const whereIn = {
    absent: () => ({ kind: 'unresolved' as const, method: fact.method, reason: 'missing_values' as const }),
    present: (values: Extract<typeof fact.values, { kind: 'present' }>) => {
      const nonEmpty = values.value.length > 0;
      const handlers = Object.freeze({
        empty: () => ({ kind: 'unresolved' as const, method: fact.method, reason: 'missing_values' as const }),
        non_empty: () => ({ kind: 'in' as const, values: resolveAllowedValues(values.value) }),
      });
      return handlers[nonEmpty ? 'non_empty' : 'empty']();
    },
  };
  const resolvers = {
    where: () => where[fact.value.kind](fact.value as never),
    whereNumber: () => MATCHER_BY_METHOD.whereNumber(),
    whereAlpha: () => MATCHER_BY_METHOD.whereAlpha(),
    whereAlphaNumeric: () => MATCHER_BY_METHOD.whereAlphaNumeric(),
    whereUuid: () => MATCHER_BY_METHOD.whereUuid(),
    whereUlid: () => MATCHER_BY_METHOD.whereUlid(),
    whereIn: () => whereIn[fact.values.kind](fact.values as never),
  } satisfies Readonly<Record<RouteConstraintFact['method'], () => RouteConstraintMatcher>>;
  return resolvers[fact.method]();
}

function resolveAllowedValues(values: readonly import('../../../../types/upstream/valueObjects').StringValue[]): readonly RouteConstraintAllowedValue[] {
  return Object.freeze(values.map(value => {
    const expression = value.value.trim();
    const enumCases = expression.match(/^(?<enumName>[A-Za-z_][A-Za-z0-9_\\]*)::cases\(\)$/);
    const enumName = enumCases?.groups?.enumName;
    return enumName
      ? { kind: 'enum_cases' as const, enum: createEnumName(enumName) }
      : { kind: 'literal' as const, value };
  }));
}
