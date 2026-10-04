import { projectRelation, selectRelation, expandRelation } from '../../../relational/sequence';
import type { TokenDescriptor } from '../phpAstTypes';
import type { RouteConstraintArgument } from '../../../../types/upstream/routeConstraints';
import {
  createMiddlewareNameAst,
  createRoutePathLiteral,
  createRoutePrefixAst,
  createRouteNamePrefixAst,
  createRouteControllerAst,
  createRouteDomainAst,
  createRouteConstraintParameterAst,
  createRouteConstraintValueAst,
  type RouteDeclarationAst,
  type MiddlewareNameAst,
  type LaravelRouteMethod,
  type RouteTargetAst,
  type RouteConstraintArgumentAst,
} from './routeDeclarationAst';
import { TokenCursor } from '../../../../semantic/kernel/syntax/relationalSyntaxCursor';
import { syntaxRange } from './syntaxRange';
import { parseRouteBindingDeclarations } from './routeBindingDeclarationAst';
import {
  isRoutePathToken,
  routeConstraintFact,
  routeConstraintArgumentAst,
  routeTargetMethodSet,
  routeTargetAst,
  emptyRouteGroupState,
  mergeRouteGroupStates,
  routeInvocationMethod,
  routeGroupPendingState,
  advanceRouteGroupState,
  type RouteGroupStateModel,
  type RouteConstraintSyntaxFact,
} from './semanticRouteSyntaxRelations';
import { SYNTAX_KIND_GROUPS, SYNTAX_OPERATION_GROUPS, tokenHasKind, tokenHasOperation } from './syntaxValue';
import { absent, present, presenceOf, presenceFold, type Presence } from '../../../../types/upstream/presence';
import { relationAll } from '../../../../semantic/kernel/semanticRelations';
import { relationVariantFold } from '../../../../semantic/kernel/relationalSequence';
import { continueScan, syntaxScan } from './syntaxScan';

type GroupState = RouteGroupStateModel;
type ConstraintMethod = 'where' | 'whereNumber' | 'whereAlpha' | 'whereAlphaNumeric' | 'whereUuid' | 'whereUlid' | 'whereIn';

type RouteDeclarationPresence = Presence<RouteDeclarationAst>;

export function parseRouteDeclarations(tokens: readonly TokenDescriptor[]): readonly RouteDeclarationAst[] {
  let groups: readonly GroupState[] = Object.freeze([]);
  let pending: GroupState = emptyRouteGroupState();
  const scan = syntaxScan(TokenCursor.start(tokens), cursor => {
    pending = routeGroupPendingState(cursor, pending);
    const transition = advanceRouteGroupState(presenceFold(cursor.currentPresence, () => absent<string>(), token => present(token.value)), groups, pending);
    groups = Object.freeze([...transition.groups]);
    pending = transition.pending;
    return continueScan(cursor.advance(), ...presenceValues(routeDeclarationAt(cursor, groups)));
  });
  return scan.values;
}

const presenceValues = <T>(value: Presence<T>): readonly T[] =>
  presenceFold(value, () => Object.freeze([]), entry => Object.freeze([entry]));

function routeDeclarationAt(cursor: TokenCursor, groups: readonly GroupState[]): RouteDeclarationPresence {
  return presenceFold(
    routeInvocationMethod(cursor),
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
  const effective = mergeRouteGroupStates(groups);
  const targetMethodSet = routeTargetMethodSet(cursor.callArgumentCursor, method);
  const source = presenceFold(cursor.currentPresence, () => path, value => value);
  const terminal = presenceFold(end.terminalPresence, () => path, value => value);
  return Object.freeze({
    method,
    targetMethods: targetMethodSet.methods,
    path: createRoutePathLiteral(path.value),
    target: targetAt(cursor, method),
    bindings: parseRouteBindingDeclarations(path.value),
    prefix: Object.freeze(projectRelation(effective.prefixes, createRoutePrefixAst)),
    middleware: Object.freeze(projectRelation(effective.middleware, createMiddlewareNameAst)),
    routeMiddleware: Object.freeze(readRouteMiddleware(cursor.callArgumentCursor, end)),
    groupNamePrefix: Object.freeze(projectRelation(effective.namePrefixes, createRouteNamePrefixAst)),
    ...presenceFold(effective.controller, () => Object.freeze({}), entry => Object.freeze({ groupController: createRouteControllerAst(entry) })),
    ...presenceFold(effective.domain, () => Object.freeze({}), entry => Object.freeze({ groupDomain: createRouteDomainAst(entry) })),
    groupBindingScope: effective.bindingScope,
    missingHandler: hasMissingHandler(cursor.callArgumentCursor, end),
    withTrashed: hasWithTrashed(cursor.callArgumentCursor, end),
    routeConstraints: Object.freeze(projectRelation(readRouteConstraints(cursor.callArgumentCursor, end), item => ({
      method: item.method,
      parameter: createRouteConstraintParameterAst(item.parameter),
      argument: constraintArgumentAst(item),
    }))),
    groupConstraints: Object.freeze(projectRelation(effective.constraints, item => ({
      method: item.method,
      parameter: createRouteConstraintParameterAst(item.parameter.value.value),
      argument: groupConstraintArgumentAst(item.argument),
    }))),
    source,
    end: terminal,
  });
}

function readMiddleware(call: TokenCursor): readonly MiddlewareNameAst[] {
  return presenceFold(
    call.callClosePresence,
    () => [],
    end => projectRelation(selectRelation(syntaxRange(call.callArgumentCursor, end).tokens(), token => tokenHasKind(token, SYNTAX_KIND_GROUPS.strings)), token => createMiddlewareNameAst(token.value)),
  );
}

function findPathCursor(start: TokenCursor, method: LaravelRouteMethod): Presence<TokenCursor> {
  return start.findWitness((token, at) => relationAll([tokenHasKind(token, SYNTAX_KIND_GROUPS.strings), isRoutePathToken(at, method)]));
}

function targetAt(route: TokenCursor, method: LaravelRouteMethod): RouteTargetAst { return routeTargetAst(route, method); }

function findDeclarationEnd(start: TokenCursor): TokenCursor {
  return presenceFold(start.callClosePresence, () => start.statementEndCursor, value => value);
}


function groupConstraintArgumentAst(argument: RouteConstraintArgument): RouteConstraintArgumentAst {
  return relationVariantFold<RouteConstraintArgument, 'pattern', RouteConstraintArgumentAst>(argument, 'pattern',
    rest => relationVariantFold<Exclude<RouteConstraintArgument, { readonly kind: 'pattern' }>, 'values', RouteConstraintArgumentAst>(rest, 'values',
      () => Object.freeze({ kind: 'none' as const }),
      values => Object.freeze({
        kind: 'values' as const,
        values: projectRelation(values.values, value => createRouteConstraintValueAst(value.value)),
      })),
    pattern => Object.freeze({
      kind: 'pattern' as const,
      value: createRouteConstraintValueAst(pattern.value.value),
    }));
}

function constraintArgumentAst(item: RouteConstraintSyntaxFact): RouteConstraintArgumentAst {
  return routeConstraintArgumentAst(item.argument);
}

function inRangePresence(start: TokenCursor, end: TokenCursor, predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): Presence<TokenCursor> {
  return syntaxRange(start, end).findPresence(predicate);
}

const presenceBoolean = (value: Presence<TokenCursor>): boolean => presenceFold(value, () => false, () => true);

function hasWithTrashed(start: TokenCursor, end: TokenCursor): boolean {
  return presenceBoolean(inRangePresence(start, end, token => tokenHasOperation(token, SYNTAX_OPERATION_GROUPS.withTrashed)));
}

function readRouteConstraints(start: TokenCursor, end: TokenCursor): readonly RouteConstraintSyntaxFact[] {
  return expandRelation(syntaxRange(start, end).project((_, cursor) => routeConstraintFact(cursor)), presenceValues);
}

function readRouteMiddleware(start: TokenCursor, end: TokenCursor): readonly MiddlewareNameAst[] {
  return expandRelation(syntaxRange(start, end).findAll((_, cursor) => presenceFold(cursor.currentPresence, () => false, token => tokenHasOperation(token, SYNTAX_OPERATION_GROUPS.middleware))), cursor => readMiddleware(cursor.callArgumentCursor));
}

function hasMissingHandler(start: TokenCursor, end: TokenCursor): boolean {
  return presenceBoolean(inRangePresence(start, end, (token, cursor) => presenceFold(cursor.previousPresence, () => false, previous => relationAll([tokenHasOperation(token, SYNTAX_OPERATION_GROUPS.missing), tokenHasKind(previous, SYNTAX_KIND_GROUPS.closeParens)]))));
}
