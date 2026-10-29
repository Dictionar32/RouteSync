import type { RouteDeclarationAst, RouteConstraintArgumentAst } from '../../../../frontend/php/routeAst/routeDeclarationAst';
import type { RouteGroupFact } from '../../../../../types/upstream/routeGroupFacts';
import { createControllerName, createDomainTypeName, createMiddlewareName, createRouteParameterName, stringValue } from '../../../../../types/upstream/names';
import { mapPresenceValue } from '../../../../../types/upstream/presence';
import type { RouteConstraintArgument } from '../../../../../types/upstream/routeConstraints';
export type { RouteGroupFact } from '../../../../../types/upstream/routeGroupFacts';

export interface RouteGroupAstFactsOperationInterface {
  readonly extractFacts: (declaration: RouteDeclarationAst) => RouteGroupFact;
}

const routeConstraintArgumentFact = (argument: RouteConstraintArgumentAst): RouteConstraintArgument => {
  switch (argument.kind) {
    case 'none':
      return Object.freeze({ kind: 'none' });
    case 'values':
      return Object.freeze({
        kind: 'values',
        values: Object.freeze(argument.values.map(value => stringValue.create(value))),
      });
    case 'pattern':
      return Object.freeze({ kind: 'pattern', value: stringValue.create(argument.value) });
    default: {
      const exhaustive: never = argument;
      return exhaustive;
    }
  }
};

/** AST -> typed syntax fact. Group values are not Laravel-resolved here. */
const extractRouteGroupFactsImplementation: RouteGroupAstFactsOperationInterface['extractFacts'] =
  (declaration) => Object.freeze({
    prefix: Object.freeze(declaration.prefix.map(value => stringValue.create(value))),
    middleware: Object.freeze(declaration.middleware.map(value => createMiddlewareName(value))),
    namePrefix: Object.freeze(declaration.groupNamePrefix.map(value => stringValue.create(value))),
    controller: mapPresenceValue(declaration.groupController, createControllerName),
    domain: mapPresenceValue(declaration.groupDomain, createDomainTypeName),
    bindingScope: declaration.groupBindingScope,
    constraints: Object.freeze(declaration.groupConstraints.map(constraint => Object.freeze({
      parameter: createRouteParameterName(constraint.parameter),
      method: constraint.method,
      argument: routeConstraintArgumentFact(constraint.argument),
      source: Object.freeze({ kind: 'group' as const }),
    }))),
  });

/** Public runtime API: a typed operation object, not an exported free function. */
export const routeGroupAstFactsOperations: RouteGroupAstFactsOperationInterface = Object.freeze({
  extractFacts: extractRouteGroupFactsImplementation,
});
