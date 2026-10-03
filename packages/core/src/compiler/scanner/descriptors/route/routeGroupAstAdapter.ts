import type { RouteDeclarationAst } from '../../lexer/routeAst/routeDeclarationAst';
import type { RouteGroupFact } from '../../../../types/upstream/routeGroupFacts';
import { createControllerName, createDomainTypeName, createMiddlewareName, createRouteParameterName, stringValue } from '../../../../types/upstream/names';
import { mapPresenceValue } from '../../../../types/upstream/presence';
import { projectRelation } from '../../../relational/sequence';
export type { RouteGroupFact } from '../../../../types/upstream/routeGroupFacts';

/** AAT -> typed syntax fact. Group values are not Laravel-resolved here. */
export function extractRouteGroupFactsFromAst(declaration: RouteDeclarationAst): RouteGroupFact {
  return Object.freeze({
    prefix: Object.freeze(projectRelation(declaration.prefix, stringValue)),
    middleware: Object.freeze(projectRelation(declaration.middleware, createMiddlewareName)),
    namePrefix: Object.freeze(projectRelation(declaration.groupNamePrefix, stringValue)),
    controller: mapPresenceValue(declaration.groupController, createControllerName),
    domain: mapPresenceValue(declaration.groupDomain, createDomainTypeName),
    bindingScope: declaration.groupBindingScope,
    constraints: Object.freeze(projectRelation(declaration.groupConstraints, constraint => Object.freeze({
      parameter: createRouteParameterName(constraint.parameter),
      value: stringValue(constraint.value),
    }))),
  });
}
