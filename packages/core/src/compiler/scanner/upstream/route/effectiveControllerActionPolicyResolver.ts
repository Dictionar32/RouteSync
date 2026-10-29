/**
 * AST-free Laravel effective controller-action policy resolver.
 *
 * This is the semantic closure boundary for controller policy. It resolves
 * controller inheritance, action-scoped authorization, and route/resource/
 * controller middleware before generic semantic dataflow consumes the result.
 */
import type {
  ControllerMiddlewareRelation,
  ControllerAuthorizationRelation,
  ControllerInheritanceRelation,
  ControllerPolicyActionScopeJudgment,
  ControllerPolicyActionScopeBlockReason,
  ControllerPolicyRelation,
} from '../../../../types/upstream/controller';
import type { EffectiveControllerActionPolicy } from '../../../../types/upstream/effectiveControllerActionPolicy';
import type { ActionName, MiddlewareName, ControllerName } from '../../../../types/upstream/names';
import type {
  RouteMiddlewareContract,
  RouteMiddlewareExclusionContract,
  RouteMiddlewareSemanticInput,
} from '../../../../types/upstream/routeMiddleware';
import { sourceSpanOperations, type SourceSpan } from '../../../../types/upstream/provenance';
import { routeMiddlewareSemanticInputOperations } from './routeMiddlewareSemanticInputBuilder';
import { routeMiddlewareFlowResolver } from '../../../semantic/routeMiddlewareFlowResolver';
import { effectiveControllerActionPolicyAlgebra } from '../../../../types/upstream/effectiveControllerActionPolicyAlgebra';

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
  Object.is(left.value.value, right.value.value);

const inheritedControllers = (
  controller: ControllerName,
  relations: readonly ControllerInheritanceRelation[],
): readonly ControllerName[] => {
  const visit = (current: ControllerName, seen: readonly string[]): readonly ControllerName[] => {
    const parents = relations.filter(relation => sameController(relation.child, current));
    return parents.flatMap(parent => {
      const name = parent.parent.value.value;
      if (seen.includes(name)) return [];
      const next = { kind: 'controller_name' as const, value: { kind: 'string_value' as const, value: name } };
      return [next, ...visit(next, [...seen, name])];
    });
  };
  return Object.freeze(visit(controller, [controller.value.value]));
};

const samePolicySource = (left: ControllerPolicyRelation, right: ControllerPolicyRelation): boolean => {
  const sameSpan = sourceSpanOperations.same(left.source, right.source).kind === 'same_source_span';
  if (!sameSpan || left.kind !== right.kind) return false;
  switch (left.kind) {
    case 'controller_authorization_relation':
      return right.kind === 'controller_authorization_relation';
    case 'controller_middleware_relation':
      switch (left.middleware.kind) {
        case 'middleware_name':
          return right.kind === 'controller_middleware_relation' &&
            right.middleware.kind === 'middleware_name' &&
            left.exclusion === right.exclusion &&
            Object.is(left.middleware.value.value, right.middleware.value.value);
        default:
          return left === right;
      }
  }
};

const policyForController = (
  controller: ControllerName,
  catalog: readonly ControllerPolicyCatalogEntry[],
): readonly ControllerPolicyRelation[] => catalog
  .filter(entry => sameController(entry.controller, controller))
  .flatMap(entry => entry.relations)
  .filter((relation, index, relations) => relations.findIndex(candidate => samePolicySource(candidate, relation)) === index);

const routeMiddlewareScopeFromControllerScope = (scope: ControllerPolicyActionScopeJudgment): RouteMiddlewareContract['scope'] => {
  switch (scope.kind) {
    case 'blocked': return { kind: 'blocked', reason: scope.reason };
    case 'all': return { kind: 'all' };
    case 'only': return { kind: 'only', actions: sequenceToArray(scope.actions) };
    case 'except': return { kind: 'except', actions: sequenceToArray(scope.actions) };
    case 'only_except': return {
      kind: 'only_except',
      only: sequenceToArray(scope.only),
      except: sequenceToArray(scope.except),
    };
  }
};

type NamedControllerMiddlewareRelation = ControllerMiddlewareRelation & { readonly middleware: MiddlewareName };

const middlewarePolicy = (relations: readonly ControllerPolicyRelation[]): readonly RouteMiddlewareContract[] =>
  Object.freeze(relations
    .filter((relation): relation is NamedControllerMiddlewareRelation =>
      relation.kind === 'controller_middleware_relation' && !relation.exclusion && relation.middleware.kind === 'middleware_name')
    .map(relation => ({
      middleware: { kind: 'named' as const, name: relation.middleware, parameters: [] },
      source: relation.scope.kind === 'method' ? { kind: 'controller_method' as const } : { kind: 'controller_class' as const },
      scope: routeMiddlewareScopeFromControllerScope(relation.actions),
    })));

const middlewareExclusions = (relations: readonly ControllerPolicyRelation[]): readonly RouteMiddlewareExclusionContract[] =>
  Object.freeze(relations
    .filter((relation): relation is NamedControllerMiddlewareRelation =>
      relation.kind === 'controller_middleware_relation' && relation.exclusion && relation.middleware.kind === 'middleware_name')
    .map(relation => ({
      middleware: { kind: 'named' as const, name: relation.middleware, parameters: [] },
      source: relation.scope.kind === 'method' ? { kind: 'controller_method' as const } : { kind: 'controller_class' as const },
      scope: routeMiddlewareScopeFromControllerScope(relation.actions),
    })));

/** Resolve one concrete controller action into one closed semantic policy. */
const resolveEffectiveControllerActionPolicy = (
  input: EffectiveControllerActionPolicyInput,
): EffectiveControllerActionPolicy => {
  const inherited = input.inheritance ? inheritedControllers(input.controller, input.inheritance) : Object.freeze([] as ControllerName[]);
  const inheritedPolicyControllers = input.inheritance ? inherited : input.inheritedFrom ?? [];
  const policyCatalog = input.policyCatalog ?? [];
  const ownRelations = input.policy ?? policyForController(input.controller, policyCatalog);
  // Inheritance transfers class-level policy, not method-level policy declared
  // by an ancestor action. The catalog is action-derived, so it can contain
  // both scopes repeated across several action entries; close the scope here
  // before composing inherited evidence into the concrete child action.
  const inheritedRelations = inheritedPolicyControllers
    .flatMap(controller => policyForController(controller, policyCatalog))
    .filter(relation => relation.scope.kind === 'class');
  const allPolicy = Object.freeze([...inheritedRelations, ...ownRelations, ...(input.authorization ?? [])]);
  const controllerMiddleware = middlewarePolicy(allPolicy);
  const controllerExclusions = middlewareExclusions(allPolicy);
  const middlewareInput: RouteMiddlewareSemanticInput = {
    declarations: Object.freeze([...input.middleware.declarations, ...controllerMiddleware]),
    exclusions: Object.freeze([...input.middleware.exclusions, ...controllerExclusions]),
    action: input.middleware.action,
  };
  const flow = routeMiddlewareFlowResolver.resolve(middlewareInput);
  const blockedPolicyReasons: readonly ControllerPolicyActionScopeBlockReason[] = Object.freeze(allPolicy.flatMap(relation => {
    switch (relation.kind) {
      case 'controller_authorization_relation':
        switch (relation.actions.kind) {
          case 'blocked': return [relation.actions.reason];
          case 'all':
          case 'only':
          case 'except':
          case 'only_except': return [];
        }
      case 'controller_middleware_relation':
        switch (relation.middleware.kind) {
          case 'middleware_name': return [];
          default:
            switch (relation.actions.kind) {
              case 'blocked': return [relation.actions.reason];
              case 'all':
              case 'only':
              case 'except':
              case 'only_except': return [];
            }
        }
    }
  }));
  const flowReasons = (() => {
    switch (flow.judgment.kind) {
      case 'complete': return Object.freeze([]);
      case 'blocked': return flow.judgment.reasons;
    }
  })();
  const policyReasons = Object.freeze([...flowReasons, ...blockedPolicyReasons]);
  const policyJudgment = (() => {
    switch (policyReasons.length) {
      case 0: return Object.freeze({ kind: 'complete' as const });
      default: return Object.freeze({ kind: 'blocked' as const, reasons: policyReasons });
    }
  })();
  // Authorization action-scope applicability has one owner: the existing
  // upstream algebra. This resolver retains inheritance and middleware-flow
  // orchestration but does not reimplement the scope judgment.
  const authorization = effectiveControllerActionPolicyAlgebra.authorization(
    allPolicy,
    input.action,
  );
  const identity = Object.freeze({
    kind: 'effective_controller_action_policy' as const,
    controller: input.controller,
    action: input.action,
    inheritedFrom: Object.freeze([...(input.inheritedFrom ?? []), ...inherited].filter((controller, index, controllers) => controllers.findIndex(candidate => sameController(candidate, controller)) === index)),
    source: Object.freeze([...(input.source ?? [])]),
  });
  switch (policyJudgment.kind) {
    case 'blocked':
      return Object.freeze({ ...identity, judgment: policyJudgment });
    case 'complete':
      return Object.freeze({
        ...identity,
        judgment: policyJudgment,
        middleware: Object.freeze([...flow.effectiveMiddleware]),
        authorization,
      });
  }
};

/** Aggregate route/resource evidence and resolve the same closed policy. */
const resolveEffectiveControllerActionPolicyFromEvidence = (
  input: Omit<EffectiveControllerActionPolicyInput, 'middleware'> & { readonly evidence: EffectiveControllerActionPolicyEvidence },
): EffectiveControllerActionPolicy => resolveEffectiveControllerActionPolicy({
  ...input,
  middleware: routeMiddlewareSemanticInputOperations.build(input.evidence, { kind: 'present', value: input.action }),
});


export interface EffectiveControllerActionPolicyOperationsInterface {
  readonly resolve: (input: EffectiveControllerActionPolicyInput) => EffectiveControllerActionPolicy;
  readonly resolveFromEvidence: (
    input: Omit<EffectiveControllerActionPolicyInput, 'middleware'> & { readonly evidence: EffectiveControllerActionPolicyEvidence },
  ) => EffectiveControllerActionPolicy;
}

export const effectiveControllerActionPolicyOperations: EffectiveControllerActionPolicyOperationsInterface = Object.freeze({
  resolve: resolveEffectiveControllerActionPolicy,
  resolveFromEvidence: resolveEffectiveControllerActionPolicyFromEvidence,
});
