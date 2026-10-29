/**
 * Projects proven Laravel route-parameter bindings into canonical semantic
 * dataflow seed facts. Route/policy semantics remain owned by their upstream
 * contracts; only the actual parameter-to-controller value flow enters
 * SemanticDataflowInput.
 */
import type { CompleteLaravelSourceModel } from './highLevelSourceModel';
import type { ControllerActionFlowContract } from './highLevelContracts';
import type { RouteHighLevelContract } from './highLevelContracts';
import { semanticDataflowFactLineageOperations, type SemanticDataflowInput, type SemanticDataflowInputFact, type SemanticDataflowIdentity } from './semanticDataflow';
import type { RouteParameter } from './route';
import { routeBindingInterfaceFactory } from './routeBinding';
import type { ControllerParameter } from './controller';
import { stringValue } from './valueObjects';

const controllerName = (controller: ControllerActionFlowContract): string => controller.controller.value.value;
const controllerAction = (controller: ControllerActionFlowContract): string => controller.action.value.value;
const routeTarget = (route: RouteHighLevelContract) => route.bindings.target;

const routeControllerMatches = (route: RouteHighLevelContract, controller: ControllerActionFlowContract): boolean => {
  const target = routeTarget(route);
  if (target.kind !== 'controller_action' && target.kind !== 'controller_invokable') return false;
  return target.controller.name.value.value === controllerName(controller)
    && target.controller.action.value.value === controllerAction(controller);
};

const routeContractItems = (
  items: CompleteLaravelSourceModel['contracts']['routes'],
  output: readonly RouteHighLevelContract[] = [],
): readonly RouteHighLevelContract[] =>
  items.kind === 'empty' ? output : routeContractItems(items.tail, [...output, items.head]);

const routeParameterItems = (
  items: ReturnType<typeof routeBindingInterfaceFactory.fromParameters>['parameters']['items'],
  output: readonly RouteParameter[] = [],
): readonly RouteParameter[] =>
  items.kind === 'empty' ? output : routeParameterItems(items.tail, [...output, items.head]);

const controllerParameterItems = (
  items: ControllerActionFlowContract['parameters'],
  output: readonly ControllerParameter[] = [],
): readonly ControllerParameter[] =>
  items.kind === 'empty' ? output : controllerParameterItems(items.tail, [...output, items.head]);

const identityForRouteParameter = (route: RouteHighLevelContract, parameter: RouteParameter): SemanticDataflowIdentity => Object.freeze({
  kind: 'semantic_dataflow_identity',
  source: route.provenance.span,
  role: 'binding',
  slot: stringValue.create(`route:${route.identity.key.value.value}:parameter:${parameter.name.value.value}`),
});

const identityForControllerParameter = (controller: ControllerActionFlowContract, parameter: ControllerParameter): SemanticDataflowIdentity => Object.freeze({
  kind: 'semantic_dataflow_identity',
  source: parameter.source,
  role: 'binding',
  slot: stringValue.create(`controller:${controllerName(controller)}.${controllerAction(controller)}:parameter:${parameter.variable.value.value}`),
});

const routeParameters = (route: RouteHighLevelContract): readonly RouteParameter[] => routeParameterItems(routeBindingInterfaceFactory.fromParameters(route.bindings.parameters).parameters.items);
const controllerParameters = (controller: ControllerActionFlowContract): readonly ControllerParameter[] => controllerParameterItems(controller.parameters);

const modelBinding = (parameter: RouteParameter): RouteParameter['binding'] => parameter.binding;

const boundModelName = (parameter: RouteParameter): string | undefined => {
  const binding = modelBinding(parameter);
  return binding.kind === 'implicit_model' || binding.kind === 'explicit' || binding.kind === 'custom'
    ? binding.model.name.value.value
    : undefined;
};

const routeBindingTarget = (
  controller: ControllerActionFlowContract,
  routeParameter: RouteParameter,
): ControllerParameter | undefined => {
  const model = boundModelName(routeParameter);
  if (!model) return undefined;
  return controllerParameters(controller).find(parameter =>
    parameter.kind.kind === 'model'
    && parameter.kind.model.value.value === model,
  );
};

const projectRouteParameterFactsFromSourceModel = (
  sourceModel: CompleteLaravelSourceModel,
  controller: ControllerActionFlowContract,
): readonly SemanticDataflowInputFact[] => {
  const routes = routeContractItems(sourceModel.contracts.routes).filter(route => routeControllerMatches(route, controller));
  const facts: SemanticDataflowInputFact[] = [];
  for (const route of routes) {
    for (const routeParameter of routeParameters(route)) {
      const target = controllerParameters(controller).find(parameter =>
        parameter.kind.kind === 'route_parameter'
        && parameter.kind.name.value.value === routeParameter.name.value.value,
      );
      if (!target) continue;
      facts.push(semanticDataflowFactLineageOperations.withLineage(Object.freeze({
        kind: 'value_flow' as const,
        source: identityForRouteParameter(route, routeParameter),
        target: identityForControllerParameter(controller, target),
        role: 'binding' as const,
      }), 'route', identityForRouteParameter(route, routeParameter)));

      const boundModel = routeBindingTarget(controller, routeParameter);
      if (boundModel) {
        facts.push(semanticDataflowFactLineageOperations.withLineage(Object.freeze({
          kind: 'value_flow' as const,
          source: identityForRouteParameter(route, routeParameter),
          target: identityForControllerParameter(controller, boundModel),
          role: 'binding' as const,
        }), 'route', identityForRouteParameter(route, routeParameter)));
      }
    }
  }
  return Object.freeze(facts);
};

/** The result owns the Laravel-specific operation for enriching a controller seed. */
export interface SemanticDataflowRouteProjectionResult {
  readonly kind: 'semantic_dataflow_route_projection_result';
  readonly facts: readonly SemanticDataflowInputFact[];
  readonly appendToControllerSeed: (seed: SemanticDataflowInput) => SemanticDataflowInput;
}

const routeProjectionResult = (
  facts: readonly SemanticDataflowInputFact[],
): SemanticDataflowRouteProjectionResult => {
  const canonicalFacts = facts;
  return Object.freeze({
    kind: 'semantic_dataflow_route_projection_result' as const,
    facts: canonicalFacts,
    appendToControllerSeed: (seed: SemanticDataflowInput): SemanticDataflowInput => Object.freeze({
      ...seed,
      facts: Object.freeze([...seed.facts, ...canonicalFacts]),
    }),
  });
};

const projectRouteParameterFacts = (
  sourceModel: CompleteLaravelSourceModel,
  controller: ControllerActionFlowContract,
): SemanticDataflowRouteProjectionResult => routeProjectionResult(
  projectRouteParameterFactsFromSourceModel(sourceModel, controller),
);

export interface SemanticDataflowRouteProjectionAuthorityInterface {
  readonly kind: 'semantic_dataflow_route_projection_authority';
  readonly project: (sourceModel: CompleteLaravelSourceModel, controller: ControllerActionFlowContract) => SemanticDataflowRouteProjectionResult;
}

export const semanticDataflowRouteProjectionAuthority: SemanticDataflowRouteProjectionAuthorityInterface = Object.freeze({
  kind: 'semantic_dataflow_route_projection_authority',
  project: projectRouteParameterFacts,
});
