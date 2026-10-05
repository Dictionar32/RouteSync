/**
 * AST-free Laravel effective controller-action policy resolver.
 *
 * This is the semantic closure boundary for controller policy. It resolves
 * controller inheritance, action-scoped authorization, and route/resource/
 * controller middleware before generic semantic dataflow consumes the result.
 */
import type {
  ControllerAuthorizationRelation,
  ControllerMiddlewareRelation,
  ControllerInheritanceRelation,
  ControllerPolicyActionScope,
  ControllerPolicyRelation,
} from '../../../../types/upstream/controller';
import type { EffectiveControllerActionPolicy } from '../../../../types/upstream/effectiveControllerActionPolicy';
import type { ActionName, MiddlewareName, ControllerName } from '../../../../types/upstream/names';
import type {
  RouteMiddlewareContract,
  RouteMiddlewareExclusionContract,
  RouteMiddlewareSemanticInput,
} from '../../../../types/upstream/routeMiddleware';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import { buildRouteMiddlewareSemanticInput } from './routeMiddlewareSemanticInputBuilder';
import { resolveRouteMiddlewareFlow } from './routeMiddlewareFlowResolver';
import { relationAny } from '../../../../semantic/foundation/semanticRelations';
import { relationProject, relationSelect } from '../../../../semantic/foundation/relationalSequence';

const sequenceToArray = <T>(items: import('../../../../types/upstream/collections').Sequence<T>, output: readonly T[] = []): readonly T[] =>
  items.kind === 'empty' ? output : sequenceToArray(items.tail, Object.freeze([...output, items.head]));

export interface EffectiveControllerActionPolicyEvidence {
  readonly routeGroup?: readonly MiddlewareName[];
  readonly route?: readonly MiddlewareName[];
  readonly resource?: {
    readonly declarations: readonly RouteMiddlewareContract[];
    readonly exclusions: readonly RouteMiddlewareExclusionContract[];
  };
  readonly controller?: {
    readonly declarations: readonly RouteMiddlewareContract[];
    readonly exclusions: readonly RouteMiddlewareExclusionContract[];
  };
}

export interface ControllerPolicyCatalogEntry {
  readonly controller: ControllerName;
  readonly relations: readonly ControllerPolicyRelation[];
}

export interface EffectiveControllerActionPolicyInput {
  readonly controller: ControllerName;
  readonly action: ActionName;
  readonly middleware: RouteMiddlewareSemanticInput;
  readonly policy?: readonly ControllerPolicyRelation[];
  readonly policyCatalog?: readonly ControllerPolicyCatalogEntry[];
  readonly inheritance?: readonly ControllerInheritanceRelation[];
  readonly authorization?: readonly ControllerAuthorizationRelation[];
  readonly inheritedFrom?: readonly ControllerName[];
  readonly source?: readonly SourceSpan[];
}

const sameController = (left: ControllerName, right: ControllerName): boolean =>
  left.value.value === right.value.value;

const sameAction = (left: ActionName, right: ActionName): boolean =>
  left.value.value === right.value.value;

const actionApplies = (
  scope: ControllerPolicyActionScope,
  action: ActionName,
): boolean => scope.kind === 'all'
  || (scope.kind === 'only' && relationAny(relationProject(sequenceToArray(scope.actions), candidate => sameAction(candidate, action))))
  || (scope.kind === 'except' && !relationAny(relationProject(sequenceToArray(scope.actions), candidate => sameAction(candidate, action))));

const authorizationApplies = (relation: ControllerAuthorizationRelation, action: ActionName): boolean =>
  relation.actions.kind === 'all'
  || (relation.actions.kind === 'only' && relationAny(relationProject(sequenceToArray(relation.actions.actions), candidate => sameAction(candidate, action))))
  || (relation.actions.kind === 'except' && !relationAny(relationProject(sequenceToArray(relation.actions.actions), candidate => sameAction(candidate, action))));

const inheritedControllers = (
  controller: ControllerName,
  relations: readonly ControllerInheritanceRelation[],
): readonly ControllerName[] => {
  const visit = (current: ControllerName, seen: readonly string[]): readonly ControllerName[] => {
    const parents = relationSelect(relations, relation => sameController(relation.child, current));
    return parents.flatMap(parent => {
      const name = parent.parent.value.value;
      if (seen.includes(name)) return [];
      const next = { kind: 'controller_name' as const, value: { kind: 'string_value' as const, value: name } };
      return [next, ...visit(next, [...seen, name])];
    });
  };
  return Object.freeze(visit(controller, [controller.value.value]));
};

const policyForController = (
  controller: ControllerName,
  catalog: readonly ControllerPolicyCatalogEntry[],
): readonly ControllerPolicyRelation[] =>
  catalog.flatMap(entry => sameController(entry.controller, controller) ? entry.relations : []);

const routeMiddlewareScopeFromControllerScope = (scope: ControllerPolicyActionScope): RouteMiddlewareContract['scope'] =>
  scope.kind === 'all'
    ? { kind: 'all' }
    : { kind: scope.kind, actions: sequenceToArray(scope.actions) };

const middlewarePolicy = (relations: readonly ControllerPolicyRelation[]): readonly RouteMiddlewareContract[] =>
  Object.freeze(relationProject(
    relationSelect(relations, (relation): relation is ControllerMiddlewareRelation =>
      relation.kind === 'controller_middleware_relation' && !relation.exclusion && relation.middleware.kind === 'middleware_name'),
    relation => ({
      middleware: { kind: 'named' as const, name: relation.middleware as import('../../../../types/upstream/names').MiddlewareName, parameters: [] },
      source: relation.scope.kind === 'method' ? { kind: 'controller_method' as const } : { kind: 'controller_class' as const },
      scope: routeMiddlewareScopeFromControllerScope(relation.actions),
    }),
  ));

const middlewareExclusions = (relations: readonly ControllerPolicyRelation[]): readonly RouteMiddlewareExclusionContract[] =>
  Object.freeze(relationProject(
    relationSelect(relations, (relation): relation is ControllerMiddlewareRelation =>
      relation.kind === 'controller_middleware_relation' && relation.exclusion && relation.middleware.kind === 'middleware_name'),
    relation => ({
      middleware: { kind: 'named' as const, name: relation.middleware as import('../../../../types/upstream/names').MiddlewareName, parameters: [] },
      source: relation.scope.kind === 'method' ? { kind: 'controller_method' as const } : { kind: 'controller_class' as const },
      scope: routeMiddlewareScopeFromControllerScope(relation.actions),
    }),
  ));

/** Resolve one concrete controller action into one closed semantic policy. */
export const resolveEffectiveControllerActionPolicy = (
  input: EffectiveControllerActionPolicyInput,
): EffectiveControllerActionPolicy => {
  const inherited = input.inheritance ? inheritedControllers(input.controller, input.inheritance) : Object.freeze([] as ControllerName[]);
  const ownRelations = input.policy ?? [];
  const inheritedRelations = input.policyCatalog
    ? inherited.flatMap(controller => policyForController(controller, input.policyCatalog!))
    : [];
  const allPolicy = Object.freeze([...inheritedRelations, ...ownRelations, ...(input.authorization ?? [])]);
  const controllerMiddleware = middlewarePolicy(allPolicy);
  const controllerExclusions = middlewareExclusions(allPolicy);
  const middlewareInput: RouteMiddlewareSemanticInput = {
    declarations: Object.freeze([...input.middleware.declarations, ...controllerMiddleware]),
    exclusions: Object.freeze([...input.middleware.exclusions, ...controllerExclusions]),
    action: input.middleware.action,
  };
  const flow = resolveRouteMiddlewareFlow(middlewareInput);
  const authorization = Object.freeze(relationSelect(
    relationSelect(allPolicy, (relation): relation is ControllerAuthorizationRelation => relation.kind === 'controller_authorization_relation'),
    relation => authorizationApplies(relation, input.action),
  ));
  return Object.freeze({
    kind: 'effective_controller_action_policy' as const,
    controller: input.controller,
    action: input.action,
    middleware: Object.freeze([...flow.effectiveMiddleware]),
    authorization,
    inheritedFrom: Object.freeze([...(input.inheritedFrom ?? []), ...inherited]),
    source: Object.freeze([...(input.source ?? [])]),
  });
};

/** Aggregate route/resource evidence and resolve the same closed policy. */
export const resolveEffectiveControllerActionPolicyFromEvidence = (
  input: Omit<EffectiveControllerActionPolicyInput, 'middleware'> & { readonly evidence: EffectiveControllerActionPolicyEvidence },
): EffectiveControllerActionPolicy => resolveEffectiveControllerActionPolicy({
  ...input,
  middleware: buildRouteMiddlewareSemanticInput(input.evidence, { kind: 'present', value: input.action }),
});
