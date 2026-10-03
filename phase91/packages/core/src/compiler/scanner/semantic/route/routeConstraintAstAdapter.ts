import type { RouteDeclarationAst } from '../../lexer/routeAst/routeDeclarationAst';
import type { RouteConstraintFact } from '../../../../types/upstream/routeConstraints';
import { createRouteParameterName, stringValue } from '../../../../types/upstream/names';
import { mapOptional } from '../../../../types/upstream/presence';

/** AAT/AST extraction only. No Laravel semantic method lowering occurs here. */
export function extractRouteConstraintFactsFromAst(
  declaration: RouteDeclarationAst,
): readonly RouteConstraintFact[] {
  return Object.freeze([
    ...declaration.groupConstraints.map(constraint => factFromAst(constraint, 'group')),
    ...declaration.routeConstraints.map(constraint => factFromAst(constraint, 'route')),
  ]);
}

export const adaptRouteConstraintsAst = extractRouteConstraintFactsFromAst;

function factFromAst(
  constraint: RouteDeclarationAst['routeConstraints'][number],
  source: 'group' | 'route',
): RouteConstraintFact {
  return Object.freeze({
    parameter: createRouteParameterName(constraint.parameter),
    method: constraint.method,
    value: toPresence(constraint.value),
    values: toValuesPresence(constraint.values),
    source: { kind: source },
  });
}


function toPresence(value: string | undefined) {
  return mapOptional(value, stringValue);
}

function toValuesPresence(value: readonly string[] | undefined) {
  return mapOptional(value, values => Object.freeze(values.map(stringValue)));
}
