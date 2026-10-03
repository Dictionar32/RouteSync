import type { RouteDeclarationAst } from '../../lexer/routeAst/routeDeclarationAst';
import type { RouteGroupFact } from '../../../../types/upstream/routeGroupFacts';
import { createControllerName, createDomainTypeName, createMiddlewareName, createRouteParameterName, stringValue } from '../../../../types/upstream/names';
import { mapOptional } from '../../../../types/upstream/presence';
export type { RouteGroupFact } from '../../../../types/upstream/routeGroupFacts';

/** AAT -> typed syntax fact. Group values are not Laravel-resolved here. */
export function extractRouteGroupFactsFromAst(declaration: RouteDeclarationAst): RouteGroupFact {
  return Object.freeze({
    prefix: Object.freeze(declaration.prefix.map(stringValue)),
    middleware: Object.freeze(declaration.middleware.map(createMiddlewareName)),
    namePrefix: Object.freeze(declaration.groupNamePrefix.map(stringValue)),
    controller: mapOptional(declaration.groupController, createControllerName),
    domain: mapOptional(declaration.groupDomain, createDomainTypeName),
    bindingScope: declaration.groupBindingScope,
    constraints: Object.freeze(declaration.groupConstraints.map(constraint => Object.freeze({
      parameter: createRouteParameterName(constraint.parameter),
      value: stringValue(constraint.value),
    }))),
  });
}
