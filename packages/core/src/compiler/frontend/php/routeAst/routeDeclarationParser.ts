import type { TokenDescriptor } from '../phpAstTypes';
import { routeConstraintArgumentAlgebra, type RouteConstraintArgument } from '../../../../types/upstream/routeConstraints';
import {
  middlewareNameAstFactory,
  routePathLiteralAstFactory,
  routePrefixAstFactory,
  routeNamePrefixAstFactory,
  routeControllerAstFactory,
  routeDomainAstFactory,
  routeConstraintParameterAstFactory,
  routeConstraintArgumentAstFactory,
  routeConstraintValueAstFactory,
  type RouteDeclarationAst,
  type MiddlewareNameAst,
  type LaravelRouteMethod,
  type RouteTargetAst,
  type RouteConstraintArgumentAst,
} from './routeDeclarationAst';
import { TokenCursor } from './relationalSyntaxCursor';
import { syntaxRange } from './syntaxRange';
import { routeBindingDeclarationParser } from './routeBindingDeclarationAst';
import {
  routePathTokenAcceptanceOperation,
  routeConstraintFactOperation,
  routeConstraintArgumentAstOperation,
  routeTargetMethodSetOperation,
  routeTargetAstOperation,
  emptyRouteGroupStateFactory,
  mergeRouteGroupStatesOperation,
  routeInvocationMethodOperation,
  routeGroupPendingStateOperation,
  advanceRouteGroupStateOperation,
  type RouteGroupStateModel,
  type RouteConstraintSyntaxFact,
} from './semanticRouteSyntaxRelations';
import { SYNTAX_KIND_GROUPS, SYNTAX_OPERATION_GROUPS, syntaxValueOperations } from './syntaxValue';
import { absent, present, presenceOf, presenceFold, type Presence } from '../../../../types/upstream/presence';
import { continueScan, syntaxScan } from './syntaxScan';
import { routeResourceMiddlewareAstOperation } from './routeResourceDeclarationAst';
import { resourceMiddlewareSyntaxOperation } from './semanticRouteSyntaxRelations';

type GroupState = RouteGroupStateModel;
type RouteDeclarationPresence = Presence<RouteDeclarationAst>;

export interface RouteDeclarationParserInterface {
  readonly parse: (tokens: readonly TokenDescriptor[]) => readonly RouteDeclarationAst[];
}

const parseRouteDeclarationsImplementation = (tokens: readonly TokenDescriptor[]): readonly RouteDeclarationAst[] => {
  let groups: readonly GroupState[] = Object.freeze([]);
  let pending: GroupState = emptyRouteGroupStateFactory.create();
  const scan = syntaxScan(TokenCursor.start(tokens), cursor => {
    pending = routeGroupPendingStateOperation.advance(cursor, pending);
    const transition = advanceRouteGroupStateOperation.advance(presenceFold(cursor.currentPresence, () => absent<string>(), token => present(token.value)), groups, pending);
    groups = Object.freeze([...transition.groups]);
    pending = transition.pending;
    return continueScan(cursor.advance(), ...presenceValues(routeDeclarationAt(cursor, groups)));
  });
  return scan.values;
};

export const routeDeclarationParser: RouteDeclarationParserInterface = Object.freeze({
  parse: parseRouteDeclarationsImplementation,
});

const presenceValues = <T>(value: Presence<T>): readonly T[] =>
  presenceFold(value, () => Object.freeze([]), entry => Object.freeze([entry]));

function routeDeclarationAt(cursor: TokenCursor, groups: readonly GroupState[]): RouteDeclarationPresence {
  return presenceFold(
    routeInvocationMethodOperation.resolve(cursor),
    () => ({ kind: 'absent' }),
    method => presenceFold(
      findPathCursor(cursor.callArgumentCursor, method),
      () => ({ kind: 'absent' }),
      pathCursor => presenceFold(
        presenceOf(pathCursor.current),
        () => ({ kind: 'absent' }),
        path => presentDeclaration(cursor, groups, method, path),
      ),
    ),
  );
}

const presentDeclaration = (
  cursor: TokenCursor,
  groups: readonly GroupState[],
  method: LaravelRouteMethod,
  path: TokenDescriptor,
): RouteDeclarationPresence => ({ kind: 'present', value: buildRouteDeclaration(cursor, groups, method, path) });

function buildRouteDeclaration(cursor: TokenCursor, groups: readonly GroupState[], method: LaravelRouteMethod, path: TokenDescriptor): RouteDeclarationAst {
  const end = findDeclarationEnd(cursor.afterNextCursor);
  const effective = mergeRouteGroupStatesOperation.merge(groups);
  const targetMethodSet = routeTargetMethodSetOperation.resolve(cursor.callArgumentCursor, method);
  const source = presenceFold(cursor.currentPresence, () => path, value => value);
  const terminal = presenceFold(end.terminalPresence, () => path, value => value);
  return Object.freeze({
    method,
    targetMethods: targetMethodSet.methods,
    path: routePathLiteralAstFactory.create(path.value),
    target: targetAt(cursor, method),
    bindings: routeBindingDeclarationParser.parse(path.value),
    prefix: Object.freeze(effective.prefixes.map(routePrefixAstFactory.create)),
    middleware: Object.freeze(effective.middleware.map(middlewareNameAstFactory.create)),
    routeMiddleware: Object.freeze(readRouteMiddleware(cursor.callArgumentCursor, end)),
    resourceMiddleware: Object.freeze(readResourceMiddleware(cursor.callArgumentCursor, end, false)),
    resourceMiddlewareExclusions: Object.freeze(readResourceMiddleware(cursor.callArgumentCursor, end, true)),
    groupNamePrefix: Object.freeze(effective.namePrefixes.map(routeNamePrefixAstFactory.create)),
    ...presenceFold(effective.controller, () => Object.freeze({}), entry => Object.freeze({ groupController: routeControllerAstFactory.create(entry) })),
    ...presenceFold(effective.domain, () => Object.freeze({}), entry => Object.freeze({ groupDomain: routeDomainAstFactory.create(entry) })),
    groupBindingScope: effective.bindingScope,
    missingHandler: hasMissingHandler(cursor.callArgumentCursor, end),
    withTrashed: hasWithTrashed(cursor.callArgumentCursor, end),
    resourceActionFilter: readResourceActionFilter(cursor.callArgumentCursor, end),
    resourceShallow: hasResourceOperation(cursor.callArgumentCursor, end, SYNTAX_OPERATION_GROUPS.shallow),
    resourceScoped: hasResourceOperation(cursor.callArgumentCursor, end, SYNTAX_OPERATION_GROUPS.scoped),
    resourceCreatable: hasResourceOperation(cursor.callArgumentCursor, end, SYNTAX_OPERATION_GROUPS.creatable),
    resourceDestroyable: hasResourceOperation(cursor.callArgumentCursor, end, SYNTAX_OPERATION_GROUPS.destroyable),
    routeConstraints: Object.freeze(readRouteConstraints(cursor.callArgumentCursor, end).map(item => ({
      method: item.method,
      parameter: routeConstraintParameterAstFactory.create(item.parameter),
      argument: constraintArgumentAst(item),
    }))),
    groupConstraints: Object.freeze(effective.constraints.map(item => ({
      method: item.method,
      parameter: routeConstraintParameterAstFactory.create(item.parameter.value.value),
      argument: groupConstraintArgumentAst(item.argument),
    }))),
    source,
    end: terminal,
  });
}

function readMiddleware(call: TokenCursor): readonly MiddlewareNameAst[] {
  return presenceFold(
    call.callClosePresence,
    () => [] as readonly MiddlewareNameAst[],
    end => syntaxRange(call.callArgumentCursor, end).tokens().filter(token => syntaxValueOperations.tokenHasKind(token, SYNTAX_KIND_GROUPS.strings)).map(token => middlewareNameAstFactory.create(token.value)),
  );
}

function findPathCursor(start: TokenCursor, method: LaravelRouteMethod): Presence<TokenCursor> {
  return start.findWitness((token, at) => syntaxValueOperations.tokenHasKind(token, SYNTAX_KIND_GROUPS.strings) && routePathTokenAcceptanceOperation.accepts(at, method));
}

function targetAt(route: TokenCursor, method: LaravelRouteMethod): RouteTargetAst { return routeTargetAstOperation.project(route, method); }

function findDeclarationEnd(start: TokenCursor): TokenCursor {
  return presenceFold(start.callClosePresence, () => start.statementEndCursor, value => value);
}


function groupConstraintArgumentAst(argument: RouteConstraintArgument): RouteConstraintArgumentAst {
  return routeConstraintArgumentAlgebra.match(argument, {
    pattern: pattern => routeConstraintArgumentAstFactory.pattern(routeConstraintValueAstFactory.create(pattern.value.value)),
    values: values => routeConstraintArgumentAstFactory.values(values.values.map(value => routeConstraintValueAstFactory.create(value.value))),
    none: () => routeConstraintArgumentAstFactory.none(),
  });
}

function constraintArgumentAst(item: RouteConstraintSyntaxFact): RouteConstraintArgumentAst {
  return routeConstraintArgumentAstOperation.project(item.argument);
}

function inRangePresence(start: TokenCursor, end: TokenCursor, predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): Presence<TokenCursor> {
  return syntaxRange(start, end).findPresence(predicate);
}

const presenceBoolean = (value: Presence<TokenCursor>): boolean => presenceFold(value, () => false, () => true);

function hasWithTrashed(start: TokenCursor, end: TokenCursor): boolean {
  return presenceBoolean(inRangePresence(start, end, token => syntaxValueOperations.tokenHasOperation(token, SYNTAX_OPERATION_GROUPS.withTrashed)));
}

function hasResourceOperation(start: TokenCursor, end: TokenCursor, operations: readonly import('./syntaxValue').SyntaxOperation[]): boolean {
  return presenceBoolean(inRangePresence(start, end, token => syntaxValueOperations.tokenHasOperation(token, operations)));
}

function resourceOperationStrings(start: TokenCursor, end: TokenCursor, operations: readonly import('./syntaxValue').SyntaxOperation[]): readonly string[] {
  return Object.freeze(syntaxRange(start, end).findAll((_, cursor) => presenceFold(cursor.currentPresence, () => false, token => syntaxValueOperations.tokenHasOperation(token, operations))).flatMap(cursor => presenceFold(cursor.callClosePresence, () => Object.freeze([] as readonly string[]), close =>
    Object.freeze(syntaxRange(cursor.callArgumentCursor, close).tokens().filter(token => syntaxValueOperations.tokenHasKind(token, SYNTAX_KIND_GROUPS.strings)).map(token => token.value))
  )));
}

function readResourceActionFilter(start: TokenCursor, end: TokenCursor): RouteDeclarationAst['resourceActionFilter'] {
  const only = resourceOperationStrings(start, end, Object.freeze(['only' as const]));
  const except = resourceOperationStrings(start, end, Object.freeze(['except' as const]));
  return only.length > 0
    ? { kind: 'only' as const, actions: only }
    : except.length > 0
      ? { kind: 'except' as const, actions: except }
      : undefined;
}

function readRouteConstraints(start: TokenCursor, end: TokenCursor): readonly RouteConstraintSyntaxFact[] {
  return syntaxRange(start, end).project((_, cursor) => routeConstraintFactOperation.derive(cursor)).flatMap(presenceValues);
}

function readRouteMiddleware(start: TokenCursor, end: TokenCursor): readonly MiddlewareNameAst[] {
  return syntaxRange(start, end).findAll((_, cursor) => presenceFold(cursor.currentPresence, () => false, token => syntaxValueOperations.tokenHasOperation(token, SYNTAX_OPERATION_GROUPS.middleware))).flatMap(cursor => readMiddleware(cursor.callArgumentCursor));
}

function readResourceMiddleware(start: TokenCursor, end: TokenCursor, exclusion: boolean): readonly import('./routeResourceDeclarationAst').RouteResourceMiddlewareAst[] {
  const operation = exclusion ? SYNTAX_OPERATION_GROUPS.withoutMiddlewareFor : Object.freeze([...SYNTAX_OPERATION_GROUPS.middlewareFor, 'middleware' as const]);
  return syntaxRange(start, end).findAll((_, cursor) => presenceFold(cursor.currentPresence, () => false, token => syntaxValueOperations.tokenHasOperation(token, operation))).flatMap(cursor => {
      const method = exclusion ? 'withoutMiddlewareFor' as const : presenceFold(cursor.currentPresence, () => 'middleware' as const, token =>
        syntaxValueOperations.tokenHasOperation(token, SYNTAX_OPERATION_GROUPS.middlewareFor) ? 'middlewareFor' as const : 'middleware' as const);
      const syntax = resourceMiddlewareSyntaxOperation.derive(cursor, method);
      return presenceFold(routeResourceMiddlewareAstOperation.derive(method, syntax), () => [], value => [value]);
    });
}

function hasMissingHandler(start: TokenCursor, end: TokenCursor): boolean {
  return presenceBoolean(inRangePresence(start, end, (token, cursor) => presenceFold(cursor.previousPresence, () => false, previous => syntaxValueOperations.tokenHasOperation(token, SYNTAX_OPERATION_GROUPS.missing) && syntaxValueOperations.tokenHasKind(previous, SYNTAX_KIND_GROUPS.closeParens))));
}
