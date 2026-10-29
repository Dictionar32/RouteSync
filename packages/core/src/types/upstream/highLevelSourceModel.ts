import type { ModelAst, ServiceAst, ProviderAst } from './ast';
import type { ControllerMethod } from './controller';
import { matchRequestValidationCapability } from './request';
import type { RouteDefinition } from './route';
import type { SourceSpan } from './provenance';
import type { ActionName, ControllerName, SourceFile } from './names';
import { sourceDiscoveryMatcher, sequenceAlgebra, type Sequence } from './collections';
import type { ModelReference, ResourceReference, RequestReference, ResponseReference, RouteReference, ChannelReference, ServiceReference, ControllerReference, ClassReference, SemanticRelation, SemanticRelationGraph } from './semanticReferences';
import type { EffectiveControllerActionPolicy, EffectiveControllerActionPolicyCatalogEntry } from './effectiveControllerActionPolicy';
import { controllerActionPolicyRelations } from './controllerActionPolicyRelations';
import { routeActionPolicyRelationsFromEffectivePolicy } from './routeActionPolicyRelations';
import { effectiveControllerActionPolicySemanticAuthority } from './effectiveControllerActionPolicyResolver';
import { controllerActionBindingAuthority } from './controllerActionBindingAuthority';
import { resolveServiceDependencyTarget, type ResolvedServiceDependencies } from './service';
import type { ModelHighLevelContract, ProviderHighLevelContract, ResourceHighLevelContract, RequestHighLevelContract, ResponseHighLevelContract, RouteHighLevelContract, ServiceHighLevelContract, ServiceSemanticContract, ControllerActionHighLevelContract, ControllerActionFlowContract, LaravelSemanticContractCatalog } from './highLevelContracts';
import { schemaInterfaceFromDefinition, type SchemaDefinition } from './schema';
import type { MigrationDefinition } from './migration';
import { migrationInterfaceFromDefinition } from './migrationInterface';
import type { DtoDefinition, MiddlewareDefinition, AttributeDefinition } from './application';
import type { ChannelDefinition } from './channel';
import type { SemanticDataflowQueryPolicySelection } from './semanticDataflowQueryPolicy';
import type { ManifestBuilderJudgment } from './manifestBuilderInterface';

import type { RequestFieldTarget } from './request';
import type { EndpointResponseBinding, EndpointRequestBinding } from './endpointBindings';
import type { RouteTarget } from './route';

type RequestPropertyRelation = Extract<import('./semanticReferences').SemanticRelation, { readonly kind: 'request_property' }>;
type ControllerDependencyRelation = Extract<import('./semanticReferences').SemanticRelation, { readonly kind: 'controller_dependency' }>;
type RouteResponseRelation = Extract<import('./semanticReferences').SemanticRelation, { readonly kind: 'route_response' }>;
type RouteControllerRelation = Extract<import('./semanticReferences').SemanticRelation, { readonly kind: 'route_controller' }>;

/**
 * Semantic projection knowledge. Syntax/control-flow variants are represented
 * as data dispatch tables; consumers interpret the resulting relations.
 */
const REQUEST_PROPERTY_RELATION_MODEL: Readonly<{ [Kind in RequestFieldTarget['kind']]: (request: RequestReference, target: Extract<RequestFieldTarget, { readonly kind: Kind }>) => readonly RequestPropertyRelation[] }> = Object.freeze({
  input_property: (request, target) => [{ kind: 'request_property', request, property: target.property }],
  input_collection: (request, target) => [
    { kind: 'request_property', request, property: target.property },
    { kind: 'request_property', request, property: target.element },
  ],
});

const ROUTE_REQUEST_RELATION_MODEL: Readonly<{ [Kind in EndpointRequestBinding['kind']]: (route: RouteReference, request: Extract<EndpointRequestBinding, { readonly kind: Kind }>) => ReadonlyArray<Extract<import('./semanticReferences').SemanticRelation, { readonly kind: 'route_request' }>> }> = Object.freeze({
  form_request: (route, request) => [{ kind: 'route_request', route, request: request.request }],
  framework_request: () => [],
  inline_input: () => [],
  unresolved_input: () => [],
  unresolved_action_input: () => [],
  no_input: () => [],
});

const ROUTE_RESPONSE_RELATION_MODEL: Readonly<{ [Kind in EndpointResponseBinding['kind']]: (route: RouteReference, response: Extract<EndpointResponseBinding, { readonly kind: Kind }>) => readonly RouteResponseRelation[] }> = Object.freeze({
  controller_method_response: () => [],
  controller_response_projection_blocked: () => [],
  declared_response: (route, response) => [{ kind: 'route_response', route, response: response.response }],
  inline_response: () => [],
  redirect_response: () => [],
  file_response: () => [],
  empty_response: () => [],
});

const ROUTE_TARGET_RELATION_MODEL: Readonly<{ [Kind in RouteTarget['kind']]: (route: RouteReference, target: Extract<RouteTarget, { readonly kind: Kind }>) => readonly RouteControllerRelation[] }> = Object.freeze({
  controller_action: (route, target) => [{ kind: 'route_controller', route, controller: target.controller }],
  controller_invokable: (route, target) => [{ kind: 'route_controller', route, controller: target.controller }],
  closure: () => [],
  redirect: () => [],
  view: () => [],
  fallback: () => [],
});

export interface SourceProjectIdentity {
  readonly kind: 'laravel_project';
  readonly root: SourceFile;
  readonly source: SourceSpan;
  /** Required ADT: the selected policy mode is explicit and carries its continuation operation. */
  readonly queryPolicySelection: SemanticDataflowQueryPolicySelection;
}

export interface ModelSemanticNode {
  readonly kind: 'model_semantic_node';
  readonly identity: ModelReference;
  readonly definition: ModelHighLevelContract;
  readonly source: SourceSpan;
}

/** Object-style runtime contract for projecting one AST model into its semantic node. */
export interface ModelSemanticNodeFromAstOperation {
  readonly kind: 'model_semantic_node_from_ast_operation';
  project(ast: ModelAst): ModelSemanticNode;
}

export const modelSemanticNodeFromAst: ModelSemanticNodeFromAstOperation = Object.freeze({
  kind: 'model_semantic_node_from_ast_operation',
  project: (ast: ModelAst): ModelSemanticNode => ({
    kind: 'model_semantic_node',
    identity: { kind: 'model_reference', name: ast.definition.identity.name },
    definition: ast.definition,
    source: ast.source,
  }),
});

export interface ResourceSemanticNode {
  readonly kind: 'resource_semantic_node';
  readonly identity: ResourceReference;
  readonly definition: ResourceHighLevelContract;
  readonly source: SourceSpan;
}

export interface RequestSemanticNode {
  readonly kind: 'request_semantic_node';
  readonly identity: RequestReference;
  readonly definition: RequestHighLevelContract;
  readonly source: SourceSpan;
}

export interface ResponseSemanticNode {
  readonly kind: 'response_semantic_node';
  readonly identity: ResponseReference;
  readonly definition: ResponseHighLevelContract;
  readonly source: SourceSpan;
}

export interface ControllerSemanticNode {
  readonly kind: 'controller_semantic_node';
  readonly identity: ControllerReference;
  readonly action: ControllerActionFlowContract;
  readonly source: SourceSpan;
}

export interface ServiceSemanticNode {
  readonly kind: 'service_semantic_node';
  readonly identity: ServiceReference;
  readonly definition: ServiceHighLevelContract;
  readonly resolvedDependencies: ResolvedServiceDependencies;
  readonly source: SourceSpan;
}

export interface ChannelSemanticNode {
  readonly kind: 'channel_semantic_node';
  readonly identity: ChannelReference;
  readonly definition: import('./channel').ChannelDefinition;
  readonly source: SourceSpan;
}

export interface RouteSemanticNode {
  readonly kind: 'route_semantic_node';
  readonly identity: RouteReference;
  readonly definition: RouteHighLevelContract;
  readonly source: SourceSpan;
}

const modelNodeFromAst = (ast: ModelAst): ModelSemanticNode => modelSemanticNodeFromAst.project(ast);
const serviceNodeFromAst = (ast: ServiceAst): ServiceSemanticNode => ({
  kind: 'service_semantic_node',
  identity: { kind: 'service_reference', name: ast.definition.name },
  definition: ast.definition,
  resolvedDependencies: { kind: 'resolved_service_dependencies', items: { kind: 'empty' } },
  source: ast.source,
});


const routeNodeFromAst = (ast: import('./ast').RouteAst): RouteSemanticNode => {
  const identity: RouteReference = { kind: 'route_reference', name: ast.definition.identity.key };
  return {
    kind: 'route_semantic_node',
    identity,
    definition: ast.definition,
    source: ast.source,
  };
};

export interface ProviderSemanticNode {
  readonly kind: 'provider_semantic_node';
  readonly identity: import('./names').ClassName;
  readonly definition: ProviderHighLevelContract;
  readonly source: SourceSpan;
}

export interface SourceModelCatalog {
  readonly kind: 'source_model_catalog';
  readonly controllers: Sequence<ControllerSemanticNode>;
  readonly providers: Sequence<ProviderSemanticNode>;
  readonly models: Sequence<ModelSemanticNode>;
  readonly resources: Sequence<ResourceSemanticNode>;
  readonly requests: Sequence<RequestSemanticNode>;
  readonly responses: Sequence<ResponseSemanticNode>;
  readonly services: Sequence<ServiceSemanticNode>;
  readonly routes: Sequence<RouteSemanticNode>;
  readonly channels: Sequence<ChannelSemanticNode>;
  readonly schemas: Sequence<SchemaDefinition>;
  readonly migrations: Sequence<MigrationDefinition>;
  readonly dtos: Sequence<DtoDefinition>;
  readonly middlewares: Sequence<MiddlewareDefinition>;
  readonly attributes: Sequence<AttributeDefinition>;
}

export interface SourceModelReferenceIndex {
  readonly kind: 'source_model_reference_index';
  readonly controllers: Sequence<ControllerReference>;
  readonly models: Sequence<ModelReference>;
  readonly resources: Sequence<ResourceReference>;
  readonly requests: Sequence<RequestReference>;
  readonly responses: Sequence<ResponseReference>;
  readonly routes: Sequence<RouteReference>;
  readonly graph: SemanticRelationGraph;
}

/** The graph builder requires an explicit policy inventory; absence is not an empty inventory. */
export interface SourceModelReferenceIndexBuilderInterface {
  readonly kind: 'source_model_reference_index_builder';
  readonly contractVersion: 1;
  readonly build: (
    catalog: SourceModelCatalog,
    effectivePolicies: readonly EffectiveControllerActionPolicy[],
  ) => SourceModelReferenceIndex;
}

/** Canonical policy inventory from the complete source-model controller catalog. */
const effectiveControllerActionPolicyCatalogFromSourceModel = (
  catalog: SourceModelCatalog,
): readonly EffectiveControllerActionPolicyCatalogEntry[] => sequenceAlgebra.project(
  catalog.controllers,
  controller => Object.freeze({
    controller: controller.identity.name,
    relations: Object.freeze(sequenceAlgebra.toArray(controller.action.policy)),
  }),
);



const routeMiddlewareContractsFromDefinition = (route: RouteSemanticNode) =>
  Object.freeze(sequenceAlgebra.toArray(route.definition.capability.middleware.items).map(entry => Object.freeze({
    middleware: { name: entry.name, parameters: [] },
    source: { kind: entry.kind === 'inherited' ? 'route_group' as const : 'route' as const },
    scope: { kind: 'all' as const },
  })));

const routeResourceMiddlewareContractsFromDefinition = (route: RouteSemanticNode) => {
  const special = route.definition.special;
  const resource = special.kind === 'resource' || special.kind === 'api_resource' || special.kind === 'singleton' || special.kind === 'api_singleton'
    ? special.resource
    : undefined;
  if (!resource) return { declarations: [], exclusions: [] };
  const rules = sequenceAlgebra.toArray(resource.middleware);
  const declarations = rules.flatMap(rule => sequenceAlgebra.toArray(rule.include).map(name => Object.freeze({
    middleware: { name, parameters: [] },
    source: { kind: 'resource' as const },
    scope: rule.scope,
  })));
  const exclusions = rules.flatMap(rule => sequenceAlgebra.toArray(rule.exclude).map(name => Object.freeze({
    middleware: { name, parameters: [] },
    source: { kind: 'resource' as const },
    scope: rule.scope,
  })));
  return { declarations: Object.freeze(declarations), exclusions: Object.freeze(exclusions) };
};

const blockedControllerActionPolicyForAmbiguity = (
  controller: ControllerName,
  action: ActionName,
  source: readonly SourceSpan[],
  candidates: readonly Readonly<{ readonly controller: ControllerName; readonly action: ActionName; readonly source: readonly SourceSpan[] }>[],
): EffectiveControllerActionPolicy => Object.freeze({
  kind: 'effective_controller_action_policy',
  controller,
  action,
  inheritedFrom: Object.freeze([]),
  source: Object.freeze(source),
  judgment: Object.freeze({
    kind: 'blocked',
    reasons: Object.freeze([Object.freeze({
      kind: 'controller_action_policy_binding_ambiguous' as const,
      candidates: Object.freeze(candidates),
    })]),
  }),
});

const blockedControllerActionPolicyForUnbound = (
  controller: ControllerName,
  action: ActionName,
  source: readonly SourceSpan[],
): EffectiveControllerActionPolicy => Object.freeze({
  kind: 'effective_controller_action_policy',
  controller,
  action,
  inheritedFrom: Object.freeze([]),
  source: Object.freeze(source),
  judgment: Object.freeze({
    kind: 'blocked',
    reasons: Object.freeze([Object.freeze({
      kind: 'controller_action_policy_binding_unbound' as const,
      controller,
      action,
      source: Object.freeze(source),
    })]),
  }),
});

const effectiveRouteActionPolicyRelations = (
  route: RouteSemanticNode,
  suppliedPolicies: readonly EffectiveControllerActionPolicy[],
): readonly import('./routeActionPolicyRelations').RouteActionPolicyRelation[] => {
  const target = route.definition.bindings.target;
  if (target.kind !== 'controller_action') return [];
  const routeResourceMiddleware = routeResourceMiddlewareContractsFromDefinition(route);
  const binding = controllerActionBindingAuthority.resolve({
    identity: {
      controller: target.controller.name,
      action: target.controller.action,
    },
    suppliedPolicies: suppliedPolicies.map(policy => ({
      identity: { controller: policy.controller, action: policy.action },
      value: policy,
    })),
    // Route projection consumes the canonical policy inventory only. Falling back to catalog
    // controllers here would create a second semantic-policy construction path.
    catalogControllers: [],
  });
  if (binding.kind === 'supplied_policy_ambiguous') {
    return routeActionPolicyRelationsFromEffectivePolicy(route.identity, blockedControllerActionPolicyForAmbiguity(
      target.controller.name,
      target.controller.action,
      Object.freeze([route.definition.provenance.span, ...binding.candidates.flatMap(candidate => candidate.value.source)]),
      binding.candidates.map(candidate => Object.freeze({
        controller: candidate.value.controller,
        action: candidate.value.action,
        source: candidate.value.source,
      })),
    ));
  }
  if (binding.kind === 'catalog_controller_ambiguous') {
    return routeActionPolicyRelationsFromEffectivePolicy(route.identity, blockedControllerActionPolicyForAmbiguity(
      target.controller.name,
      target.controller.action,
      Object.freeze([route.definition.provenance.span, ...binding.candidates.flatMap(candidate => [candidate.value.action.source])]),
      binding.candidates.map(candidate => Object.freeze({
        controller: candidate.value.identity.name,
        action: candidate.value.identity.action,
        source: Object.freeze([candidate.value.action.source]),
      })),
    ));
  }
  if (binding.kind === 'supplied_policy') {
    const suppliedPolicy = binding.value;
    const routeDeclarations = Object.freeze([
      ...routeMiddlewareContractsFromDefinition(route),
      ...routeResourceMiddleware.declarations,
    ]);
    const routeBlockedReasons = Object.freeze([
      ...routeDeclarations.flatMap(declaration => declaration.scope.kind === 'blocked' ? [declaration.scope.reason] : []),
      ...routeResourceMiddleware.exclusions.flatMap(exclusion => exclusion.scope.kind === 'blocked' ? [exclusion.scope.reason] : []),
    ]);
    const source = Object.freeze([...suppliedPolicy.source, route.definition.provenance.span]);
    switch (suppliedPolicy.judgment.kind) {
      case 'blocked':
        return routeActionPolicyRelationsFromEffectivePolicy(route.identity, Object.freeze({
          ...suppliedPolicy,
          judgment: Object.freeze({
            kind: 'blocked' as const,
            reasons: Object.freeze([...suppliedPolicy.judgment.reasons, ...routeBlockedReasons]),
          }),
          source,
        }));
      case 'complete': {
        const routePolicy = effectiveControllerActionPolicySemanticAuthority.judge({
          controller: suppliedPolicy.controller,
          action: suppliedPolicy.action,
          middleware: {
            declarations: Object.freeze([...routeDeclarations, ...suppliedPolicy.middleware]),
            exclusions: routeResourceMiddleware.exclusions,
            action: { kind: 'present', value: suppliedPolicy.action },
          },
          policy: [],
          // The supplied policy already contains the closed inherited products; this pass only composes route-local middleware.
          policyCatalog: { kind: 'complete', entries: [] },
          inheritedFrom: [],
          source,
        });
        switch (routePolicy.judgment.kind) {
          case 'blocked':
            return routeActionPolicyRelationsFromEffectivePolicy(route.identity, routePolicy);
          case 'complete':
            return routeActionPolicyRelationsFromEffectivePolicy(route.identity, Object.freeze({
              ...routePolicy,
              inheritedFrom: suppliedPolicy.inheritedFrom,
              authorization: suppliedPolicy.authorization,
            }));
        }
      }
      default: {
        const unreachableJudgment: never = suppliedPolicy.judgment;
        return unreachableJudgment;
      }
    }
  }
  if (binding.kind === 'unbound') {
    return routeActionPolicyRelationsFromEffectivePolicy(route.identity, blockedControllerActionPolicyForUnbound(
      target.controller.name,
      target.controller.action,
      Object.freeze([route.definition.provenance.span]),
    ));
  }
  return routeActionPolicyRelationsFromEffectivePolicy(route.identity, blockedControllerActionPolicyForUnbound(
    target.controller.name,
    target.controller.action,
    Object.freeze([route.definition.provenance.span]),
  ));
};

/**
 * Canonical controller-action policy inventory for the source-model boundary.
 * Each action is resolved once from typed controller evidence; route-specific
 * middleware is composed later by the existing route policy projection.
 */
/** Explicit input contract for inventorying effective policy judgments for the complete controller catalog. */
export interface EffectiveControllerActionPolicyInventoryInput {
  readonly kind: 'effective_controller_action_policy_inventory_input';
  readonly catalog: SourceModelCatalog;
}

/** Inventory operation contract: every controller action is resolved through the canonical semantic authority. */
export interface EffectiveControllerActionPolicyInventoryInterface {
  readonly kind: 'effective_controller_action_policy_inventory';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly inventory: (input: EffectiveControllerActionPolicyInventoryInput) => readonly EffectiveControllerActionPolicy[];
}

const effectiveControllerActionPolicyInventoryFromCatalog: EffectiveControllerActionPolicyInventoryInterface['inventory'] = input => {
  const catalog = input.catalog;
  const policyCatalog = Object.freeze({
    kind: 'complete' as const,
    entries: effectiveControllerActionPolicyCatalogFromSourceModel(catalog),
  });
  return sequenceAlgebra.project(catalog.controllers, controller => effectiveControllerActionPolicySemanticAuthority.judge({
    controller: controller.identity.name,
    action: controller.identity.action,
    middleware: {
      declarations: Object.freeze([]),
      exclusions: Object.freeze([]),
      action: { kind: 'present', value: controller.identity.action },
    },
    policy: sequenceAlgebra.toArray(controller.action.policy),
    policyCatalog,
    inheritedFrom: controller.action.inheritedFrom,
    source: Object.freeze([controller.action.source]),
  }));
};

/** Canonical interface-bound inventory operation; no direct resolver bypass is exposed to source-model construction. */
export const effectiveControllerActionPolicyInventory: EffectiveControllerActionPolicyInventoryInterface = Object.freeze({
  kind: 'effective_controller_action_policy_inventory',
  closed: true,
  contractVersion: 1,
  inventory: effectiveControllerActionPolicyInventoryFromCatalog,
});

const effectiveControllerActionPolicyBinding = (
  policies: readonly EffectiveControllerActionPolicy[],
  controller: ControllerSemanticNode,
) => controllerActionBindingAuthority.resolve({
  identity: {
    controller: controller.identity.name,
    action: controller.identity.action,
  },
  suppliedPolicies: policies.map(policy => ({
    identity: { controller: policy.controller, action: policy.action },
    value: policy,
  })),
  catalogControllers: [],
});

export const sourceModelReferenceIndexFromCatalog: SourceModelReferenceIndexBuilderInterface = Object.freeze({
  kind: 'source_model_reference_index_builder',
  contractVersion: 1,
  build: (
    catalog: SourceModelCatalog,
    effectivePolicies: readonly EffectiveControllerActionPolicy[],
  ): SourceModelReferenceIndex => {
    const modelNodes: readonly ModelSemanticNode[] = sequenceAlgebra.toArray(catalog.models);
    const relationValues = Object.freeze([
      ...sequenceAlgebra.expand(catalog.routes, route => {
        return effectiveRouteActionPolicyRelations(route, effectivePolicies);
      }),
      ...sequenceAlgebra.expand(catalog.controllers, controller => [
        ...(() => {
          const binding = effectiveControllerActionPolicyBinding(effectivePolicies, controller);
          switch (binding.kind) {
            case 'supplied_policy':
              return controllerActionPolicyRelations(binding.value);
            case 'supplied_policy_ambiguous':
              return controllerActionPolicyRelations(blockedControllerActionPolicyForAmbiguity(
                controller.identity.name,
                controller.identity.action,
                Object.freeze(binding.candidates.flatMap(candidate => candidate.value.source)),
                binding.candidates.map(candidate => Object.freeze({
                  controller: candidate.value.controller,
                  action: candidate.value.action,
                  source: candidate.value.source,
                })),
              ));
            case 'unbound':
              return controllerActionPolicyRelations(blockedControllerActionPolicyForUnbound(
                controller.identity.name,
                controller.identity.action,
                Object.freeze([controller.action.source]),
              ));
            case 'catalog_controller':
              return controllerActionPolicyRelations(blockedControllerActionPolicyForUnbound(
                controller.identity.name,
                controller.identity.action,
                Object.freeze([controller.action.source]),
              ));
            case 'catalog_controller_ambiguous':
              return controllerActionPolicyRelations(blockedControllerActionPolicyForAmbiguity(
                controller.identity.name,
                controller.identity.action,
                Object.freeze(binding.candidates.flatMap(candidate => [candidate.value.action.source])),
                binding.candidates.map(candidate => Object.freeze({
                  controller: candidate.value.identity.name,
                  action: candidate.value.identity.action,
                  source: Object.freeze([candidate.value.action.source]),
                })),
              ));
          }
        })(),
        ...sequenceAlgebra.expand(controller.action.semantic.resources, resource => [
          { kind: 'controller_resource' as const, controller: controller.identity, resource: resource.resource },
          { kind: 'controller_model' as const, controller: controller.identity, model: resource.model },
          { kind: 'controller_response' as const, controller: controller.identity, response: resource.response },
        ]),
        ...sequenceAlgebra.expand(controller.action.dependencies, dependency => {
          const modelNames = sequenceAlgebra.project(catalog.models, model => model.identity.name);
          const serviceNames = sequenceAlgebra.project(catalog.services, service => service.identity.name);
          const resolved = resolveServiceDependencyTarget(dependency.type, modelNames, serviceNames);
          return [{
            kind: 'controller_dependency' as const,
            controller: controller.identity,
            dependency: resolved,
          } satisfies ControllerDependencyRelation];
        }),
      ]),
      ...modelNodes.flatMap(model => model.definition.semantic.relation.semantic.map(relation => ({
        kind: 'model_relation' as const,
        model: model.identity,
        target: { kind: 'model_reference' as const, name: relation.targetModel },
        relation,
      }))),
      ...sequenceAlgebra.expand(catalog.resources, resource => [
        { kind: 'resource_model' as const, resource: resource.identity, model: resource.definition.model },
        { kind: 'response_resource' as const, response: resource.definition.response, resource: resource.identity },
      ]),
      ...sequenceAlgebra.expand(catalog.requests, request => {
        const fields = matchRequestValidationCapability(request.definition.validation, {
          no_form_request_validation: () => ({ kind: 'empty' as const }),
          form_request_validation: value => value.schema.fields.items,
        });
        return sequenceAlgebra.expand(fields, field => REQUEST_PROPERTY_RELATION_MODEL[field.target.kind](request.identity, field.target));
      }),
      ...sequenceAlgebra.expand(catalog.routes, route => {
        const request = route.definition.bindings.request;
        const response = route.definition.bindings.response;
        const target = route.definition.bindings.target;
        return [
          ...ROUTE_REQUEST_RELATION_MODEL[request.kind](route.identity, request),
          ...ROUTE_RESPONSE_RELATION_MODEL[response.kind](route.identity, response),
          ...ROUTE_TARGET_RELATION_MODEL[target.kind](route.identity, target),
        ];
      }),
    ]);

    return {
      kind: 'source_model_reference_index',
      controllers: sequenceAlgebra.fromArray(sequenceAlgebra.project(catalog.controllers, node => node.identity)),
      models: sequenceAlgebra.fromArray(sequenceAlgebra.project(catalog.models, node => node.identity)),
      resources: sequenceAlgebra.fromArray(sequenceAlgebra.project(catalog.resources, node => node.identity)),
      requests: sequenceAlgebra.fromArray(sequenceAlgebra.project(catalog.requests, node => node.identity)),
      responses: sequenceAlgebra.fromArray(sequenceAlgebra.project(catalog.responses, node => node.identity)),
      routes: sequenceAlgebra.fromArray(sequenceAlgebra.project(catalog.routes, node => node.identity)),
      graph: { kind: 'semantic_relation_graph', relations: sequenceAlgebra.fromArray(relationValues) },
    };
    },
});

/** Canonical alias retained for the source-model reference-index operation. */
export const sourceModelReferenceIndexBuilder: SourceModelReferenceIndexBuilderInterface = sourceModelReferenceIndexFromCatalog;

/**
 * Canonical projection boundary from semantic nodes into Laravel contracts.
 * The projection preserves node-owned semantic values; it does not create a
 * second semantic source. Consumers should depend on this interface rather
 * than the scanner/catalog implementation.
 */
export interface SemanticContractCatalogFromSourceCatalogOperation {
  readonly kind: 'semantic_contract_catalog_from_source_catalog_operation';
  project(catalog: SourceModelCatalog): LaravelSemanticContractCatalog;
}

export const semanticContractCatalogFromSourceCatalog: SemanticContractCatalogFromSourceCatalogOperation = Object.freeze({
  kind: 'semantic_contract_catalog_from_source_catalog_operation',
  project: (catalog: SourceModelCatalog): LaravelSemanticContractCatalog => {
    const collectContracts = <N, C>(items: Sequence<N>, getContract: (node: N) => C): Sequence<C> =>
      sequenceAlgebra.fromArray(sequenceAlgebra.project(items, getContract));

    return {
      models: collectContracts(catalog.models, node => node.definition),
      resources: collectContracts(catalog.resources, node => node.definition),
      requests: collectContracts(catalog.requests, node => node.definition),
      responses: collectContracts(catalog.responses, node => node.definition),
      routes: collectContracts(catalog.routes, node => node.definition),
      controllers: collectContracts(catalog.controllers, node => node.action),
      providers: collectContracts(catalog.providers, node => node.definition),
      services: collectContracts(catalog.services, node => ({
        ...node.definition,
        resolvedDependencies: node.resolvedDependencies,
      } satisfies ServiceSemanticContract)),
      schemas: sequenceAlgebra.fromArray(sequenceAlgebra.project(catalog.schemas, schemaInterfaceFromDefinition)),
      migrations: sequenceAlgebra.fromArray(sequenceAlgebra.project(catalog.migrations, migrationInterfaceFromDefinition)),
      dtos: catalog.dtos,
      middlewares: catalog.middlewares,
      attributes: catalog.attributes,
      channels: collectContracts(catalog.channels, node => node.definition),
    };
  },
});


export interface SemanticContractSeeds {
  readonly models: readonly import('./model').ModelDefinition[];
  readonly resources: readonly import('./resource').ResourceDefinition[];
  readonly requests: readonly import('./request').RequestDefinition[];
  readonly providers: readonly import('./application').ProviderDefinition[];
  readonly services: readonly import('./service').ServiceDefinition[];
  readonly responses: readonly import('./response').ResponseDefinition[];
}

export interface CompleteLaravelSourceModel {
  readonly kind: 'complete_laravel_source_model';
  readonly identity: SourceProjectIdentity;
  /**
   * Canonical upstream semantic boundary. AST/ADT catalog structures are
   * construction details and are intentionally not exposed to consumers.
   */
  readonly contracts: LaravelSemanticContractCatalog;
  /** Canonical semantic relation graph derived once from the source catalog. */
  readonly relations: SemanticRelationGraph;
}

/** Fixed-domain continuation from source-model construction into manifest construction. */
export interface CompleteSourceModelManifestBuildContinuationInterface {
  readonly onComplete: (judgment: CompleteSourceModelBuildCompleteResult) => Promise<ManifestBuilderJudgment>;
  readonly onBlocked: (judgment: CompleteSourceModelBuildBlockedResult) => Promise<ManifestBuilderJudgment>;
}

export interface CompleteSourceModelBuildCompleteResult {
  readonly kind: 'complete_source_model';
  readonly value: CompleteLaravelSourceModel;
  /** Continues this exact source-model judgment into the manifest domain without consumer discriminator checks. */
  readonly continueToManifestBuild: (continuation: CompleteSourceModelManifestBuildContinuationInterface) => Promise<ManifestBuilderJudgment>;
}

/** A policy blocker discovered while constructing the canonical source model must reach manifest publication. */
export type SourceModelPolicyBlocker = Extract<
  SemanticRelation,
  { readonly kind: 'controller_action_policy_blocked' | 'route_action_policy_blocked' }
>;

export interface CompleteSourceModelBuildBlockedResult {
  readonly kind: 'source_model_build_blocked';
  readonly identity: SourceProjectIdentity;
  readonly blockers: readonly SourceModelPolicyBlocker[];
  /** Continues this exact blocked source-model judgment without allowing it to masquerade as complete. */
  readonly continueToManifestBuild: (continuation: CompleteSourceModelManifestBuildContinuationInterface) => Promise<ManifestBuilderJudgment>;
}

export type CompleteSourceModelBuildResult =
  | CompleteSourceModelBuildCompleteResult
  | CompleteSourceModelBuildBlockedResult;

/** Closed input to the canonical complete-source-model construction operation. */
export interface CompleteLaravelSourceModelBuildInput {
  readonly kind: 'complete_laravel_source_model_build_input';
  readonly ast: import('./ast').CompleteSourceAst;
  readonly identity: SourceProjectIdentity;
  readonly seeds: SemanticContractSeeds;
}

/** Existing source-model construction operation, exposed at its semantic owner. */
export interface CompleteLaravelSourceModelBuilderInterface {
  readonly kind: 'complete_laravel_source_model_builder';
  readonly closed: true;
  readonly contractVersion: 2;
  readonly build: (input: CompleteLaravelSourceModelBuildInput) => CompleteSourceModelBuildResult;
}

export const buildCompleteLaravelSourceModel: CompleteLaravelSourceModelBuilderInterface = Object.freeze({
  kind: 'complete_laravel_source_model_builder',
  closed: true,
  contractVersion: 2,
  build: (input: CompleteLaravelSourceModelBuildInput): CompleteSourceModelBuildResult => {
    const ast = input.ast;
    const identity = input.identity;
    const seeds = input.seeds;
    const source = ast.ast;
    const completeItems = <T>(discovery: import('./collections').SourceDiscovery<T>): Sequence<T> => sourceDiscoveryMatcher.match(discovery, {
      notScanned: () => { throw Error('CompleteSourceAst invariant violated: source category was not scanned.'); },
      scanned: scanned => sequenceAlgebra.fromArray(scanned.items),
    });
    const controllers = source.controllerActions;
    const providers = seeds.providers;
    const models = completeItems(source.models.items);
    const responses = seeds.responses;
    const services = seeds.services;
    const routes = completeItems(source.routes.items);
    const channels = completeItems(source.channels.items);

    const catalog: SourceModelCatalog = {
      kind: 'source_model_catalog',
      providers: sequenceAlgebra.fromArray(providers.map(definition => ({
        kind: 'provider_semantic_node' as const,
        identity: definition.name,
        definition,
        source: definition.source,
      }))),
      controllers: sequenceAlgebra.fromArray(controllers.map(action => ({
        kind: 'controller_semantic_node' as const,
        identity: { kind: 'controller_reference' as const, name: action.controller, action: action.action },
        action,
        source: action.source,
      }))),
      models: sequenceAlgebra.fromArray(seeds.models.map(definition => ({
        kind: 'model_semantic_node' as const,
        identity: { kind: 'model_reference' as const, name: definition.identity.name },
        definition,
        source: definition.source,
      }))),
      resources: sequenceAlgebra.fromArray(
        seeds.resources.map(definition => ({
              kind: 'resource_semantic_node' as const,
              identity: { kind: 'resource_reference' as const, name: definition.name },
              definition,
              source: definition.source,
            })),
      ),
      requests: sequenceAlgebra.fromArray(
        seeds.requests.map(definition => ({
              kind: 'request_semantic_node' as const,
              identity: { kind: 'request_reference' as const, name: definition.identity.request },
              definition,
              source: definition.source,
            })),
      ),
      responses: sequenceAlgebra.fromArray(responses.map(definition => ({
        kind: 'response_semantic_node' as const,
        identity: { kind: 'response_reference' as const, name: definition.typeName },
        definition,
        source: definition.source,
      }))),
      services: sequenceAlgebra.fromArray(services.map(definition => {
        const modelNames = sequenceAlgebra.project(models, model => model.definition.identity.name);
        const serviceNames = services.map(service => service.name);
        const resolved = sequenceAlgebra.project(definition.dependencies.items, fact => ({
          kind: 'resolved_service_dependency' as const,
          fact,
          target: resolveServiceDependencyTarget(fact.target, modelNames, serviceNames),
        }));
        return {
          kind: 'service_semantic_node' as const,
          identity: { kind: 'service_reference' as const, name: definition.name },
          definition,
          resolvedDependencies: { kind: 'resolved_service_dependencies', items: sequenceAlgebra.fromArray(resolved) },
          source: definition.source,
        };
      })),
      routes: sequenceAlgebra.fromArray(sequenceAlgebra.project(routes, routeNodeFromAst)),
      channels: sequenceAlgebra.fromArray(sequenceAlgebra.project(channels, astItem => ({
        kind: 'channel_semantic_node',
        identity: { kind: 'channel_reference', name: astItem.definition.name },
        definition: astItem.definition,
        source: astItem.source,
      }))),
      schemas: sequenceAlgebra.fromArray(sequenceAlgebra.project(completeItems(source.schemas.items), item => item.definition)),
      migrations: sequenceAlgebra.fromArray(sequenceAlgebra.project(completeItems(source.migrations.items), item => item.definition)),
      dtos: sequenceAlgebra.fromArray(sequenceAlgebra.project(completeItems(source.dtos.items), item => item.definition)),
      middlewares: sequenceAlgebra.fromArray(sequenceAlgebra.project(completeItems(source.middlewares.items), item => item.definition)),
      attributes: sequenceAlgebra.fromArray(sequenceAlgebra.project(completeItems(source.attributes.items), item => item.definition)),
    };

    const contracts = semanticContractCatalogFromSourceCatalog.project(catalog);
    const effectivePolicies = effectiveControllerActionPolicyInventory.inventory(Object.freeze({
      kind: 'effective_controller_action_policy_inventory_input',
      catalog,
    }));
    const referenceIndex = sourceModelReferenceIndexBuilder.build(catalog, effectivePolicies);
    const blockers = Object.freeze(sequenceAlgebra.toArray(referenceIndex.graph.relations).filter(
      (relation): relation is SourceModelPolicyBlocker =>
        relation.kind === 'controller_action_policy_blocked' || relation.kind === 'route_action_policy_blocked',
    ));

    if (blockers.length > 0) {
      let blockedJudgment: CompleteSourceModelBuildBlockedResult;
      blockedJudgment = Object.freeze({
        kind: 'source_model_build_blocked',
        identity,
        blockers,
        continueToManifestBuild: (continuation: CompleteSourceModelManifestBuildContinuationInterface): Promise<ManifestBuilderJudgment> =>
          continuation.onBlocked(blockedJudgment),
      });
      return blockedJudgment;
    }

    let completeJudgment: CompleteSourceModelBuildCompleteResult;
    completeJudgment = Object.freeze({
      kind: 'complete_source_model',
      value: Object.freeze({
        kind: 'complete_laravel_source_model',
        identity,
        contracts,
        relations: referenceIndex.graph,
      }),
      continueToManifestBuild: (continuation: CompleteSourceModelManifestBuildContinuationInterface): Promise<ManifestBuilderJudgment> =>
        continuation.onComplete(completeJudgment),
    });
    return completeJudgment;
    },
});

/** Canonical alias retained for complete Laravel source-model construction. */
export const completeLaravelSourceModelBuilder: CompleteLaravelSourceModelBuilderInterface = buildCompleteLaravelSourceModel;
