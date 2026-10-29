import type { Expression } from './expression';
import type { ResourceFieldMeaning } from './resource';
import type { RequestFieldTarget } from './request';
import type { PropertyName } from './names';
import type { ModelReference, PropertyReference, ResourceReference } from './semanticReferences';
import type { ResponseJsonPayload, ResponseJsonShape } from './response';
import type { ModelDefinition, ModelRelation } from './model';
import type { ResourceDefinition } from './resource';
import type { RequestDefinition } from './request';
import type { ResponseDefinition } from './response';
import type { RouteDefinition } from './route';
import type { ControllerAction, ControllerHelper, ControllerDependency, ControllerSemanticDataflow } from './controller';
import type { ServiceDefinition, ResolvedServiceDependencies } from './service';
import type { ProviderDefinition, ProviderBindingAttributes, ProviderContainerBindings, DtoDefinition, MiddlewareDefinition, AttributeDefinition } from './application';
import type { SchemaInterface } from './schema';
import type { MigrationInterface } from './migrationInterface';
import type { ChannelDefinition } from './channel';

export type { ResourceFieldMeaning, RequestFieldTarget };

export type ResponsePayloadContract = ResponseJsonPayload;
export type ResponseSemanticShape = ResponseJsonShape;

/**
 * Canonical high-level Laravel contracts.
 *
 * These are real interfaces rather than aliases so upstream semantic objects
 * have a stable extension point. Producers own construction; downstream
 * consumers depend on these contracts instead of concrete AST/build wrappers.
 */

/** Canonical upstream capability interfaces.
 *
 * These expose semantic slices that downstream passes can consume without
 * depending on concrete Laravel AST/domain shapes. A domain contract can
 * therefore become more capable by composition rather than by duplicating
 * semantic fields.
 */
export interface ModelRelationSurface {
  readonly relations: ModelDefinition['relations'];
}

export interface ResourceTransformationSurface {
  readonly transformation: ResourceDefinition['transformation'];
  readonly fields: ResourceDefinition['fields'];
  readonly contract: ResourceDefinition['contract'];
}

export interface RequestValidationSurface {
  readonly validation: RequestDefinition['validation'];
}

export interface ResponseOutcomeSurface {
  readonly output: ResponseDefinition['output'];
  readonly transport: ResponseDefinition['transport'];
  readonly outcome: ResponseDefinition['outcome'];
}

export interface RouteSemanticSurface {
  readonly bindings: RouteDefinition['bindings'];
  readonly returnSemantic: RouteDefinition['returnSemantic'];
}

export interface ControllerDataflowSurface {
  readonly semantic: ControllerAction['semantic'];
}

/** Upstream dependency-flow surface; consumers never inspect parameter order. */
export interface ControllerDependencyFlowSurface {
  readonly dependencies: readonly ControllerDependency[];
}

export interface ServiceDependencySurface {
  readonly methods: ServiceDefinition['methods'];
  readonly dependencies: ServiceDefinition['dependencies'];
}

export interface ModelHighLevelContract extends ModelDefinition, ModelRelationSurface {}
export interface RelationHighLevelContract extends ModelRelation {}
export interface ResourceHighLevelContract extends ResourceDefinition, ResourceTransformationSurface {}
export interface RequestHighLevelContract extends RequestDefinition, RequestValidationSurface {}
export interface ResponseHighLevelContract extends ResponseDefinition, ResponseOutcomeSurface {}
export interface RouteHighLevelContract extends RouteDefinition, RouteSemanticSurface {}

export interface ControllerActionHighLevelContract extends ControllerAction, ControllerDataflowSurface {}

/**
 * Canonical controller flow contract. Consumers receive resolved semantic
 * flow and dependencies; they do not inspect PHP parameter positions.
 */
export interface ControllerActionFlowContract extends ControllerActionHighLevelContract, ControllerDependencyFlowSurface {
  readonly semantic: ControllerSemanticDataflow;
}
export interface ControllerHelperHighLevelContract extends ControllerHelper {}
export type ControllerHighLevelContract =
  | ControllerActionFlowContract
  | ControllerHelperHighLevelContract;

export interface ServiceHighLevelContract extends ServiceDefinition, ServiceDependencySurface {}

export interface ProviderContainerBindingSurface {
  readonly bindings: ProviderContainerBindings;
}

export interface ProviderBindingAttributeSurface {
  readonly bindingAttributes: ProviderBindingAttributes;
}

export interface ProviderHighLevelContract extends ProviderDefinition, ProviderBindingAttributeSurface, ProviderContainerBindingSurface {}

export interface ServiceSemanticContract extends ServiceHighLevelContract {
  readonly resolvedDependencies: ResolvedServiceDependencies;
}

/** Closed contracts for domains whose meaning is already derived upstream. */
export interface SchemaHighLevelContract extends SchemaInterface {}
export interface MigrationHighLevelContract extends MigrationInterface {}
export interface DtoHighLevelContract extends DtoDefinition {}
export interface MiddlewareHighLevelContract extends MiddlewareDefinition {}
export interface AttributeHighLevelContract extends AttributeDefinition {}
export interface ChannelHighLevelContract extends ChannelDefinition {}

/**
 * Closed discriminated union of every first-class Laravel semantic domain.
 * Scanner evidence and catalog builders are not members of this union.
 */
export type LaravelDomainContract =
  | ModelHighLevelContract
  | RelationHighLevelContract
  | ResourceHighLevelContract
  | RequestHighLevelContract
  | ResponseHighLevelContract
  | RouteHighLevelContract
  | ControllerHighLevelContract
  | ServiceHighLevelContract
  | ProviderHighLevelContract
  | SchemaHighLevelContract
  | MigrationHighLevelContract
  | DtoHighLevelContract
  | MiddlewareHighLevelContract
  | AttributeHighLevelContract
  | ChannelHighLevelContract;

/**
 * Semantic lookup boundary used by upstream consumers. The producer may use
 * indexes/builders internally, but consumers only see the canonical ADT.
 */
/**
 * Canonical semantic contract catalog for an entire Laravel source model.
 * This is the upstream boundary consumed by graph and later semantic passes;
 * it is intentionally plural because Laravel source projects contain many
 * models, resources, requests, routes, controllers, and services.
 */
export interface LaravelSemanticContractCatalog {
  readonly models: readonly ModelHighLevelContract[];
  readonly resources: readonly ResourceHighLevelContract[];
  readonly requests: readonly RequestHighLevelContract[];
  readonly responses: readonly ResponseHighLevelContract[];
  readonly routes: readonly RouteHighLevelContract[];
  readonly controllers: readonly ControllerActionFlowContract[];
  readonly services: readonly ServiceSemanticContract[];
  readonly providers: readonly ProviderHighLevelContract[];
  /** Migration-derived schema semantics are retained at the canonical source boundary. */
  readonly schemas: readonly SchemaHighLevelContract[];
  readonly migrations: readonly MigrationHighLevelContract[];
  /** Laravel application surfaces scanned upstream must not disappear at model projection. */
  readonly dtos: readonly DtoHighLevelContract[];
  readonly middlewares: readonly MiddlewareHighLevelContract[];
  readonly attributes: readonly AttributeHighLevelContract[];
  readonly channels: readonly ChannelHighLevelContract[];
}

/** Resource-field semantic projection consumed by response/graph layers. */
export interface ResourceFieldSemanticContract {
  readonly field: PropertyName;
  readonly meaning: ResourceFieldMeaning;
  readonly expression: Expression;
  readonly model: ModelReference | { readonly kind: 'absent' };
  readonly property: PropertyReference | { readonly kind: 'absent' };
  readonly resource: ResourceReference | { readonly kind: 'absent' };
  readonly validation: RequestDefinition['validation'] | { readonly kind: 'absent' };
}
