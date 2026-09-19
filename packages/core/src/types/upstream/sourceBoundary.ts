import type {
  ModelAst, ResourceAst, RequestAst, RouteAst, ControllerAst, ResponseAst,
  ServiceAst, MigrationAst, DtoAst, MiddlewareAst, ProviderAst, AttributeAst
} from './ast';

export type CanonicalSourceNode =
  | ModelAst | ResourceAst | RequestAst | RouteAst | ControllerAst | ResponseAst
  | ServiceAst | MigrationAst | DtoAst | MiddlewareAst | ProviderAst | AttributeAst;

export type SourceBoundaryInput =
  | { readonly kind: 'model_source'; readonly node: ModelAst }
  | { readonly kind: 'resource_source'; readonly node: ResourceAst }
  | { readonly kind: 'request_source'; readonly node: RequestAst }
  | { readonly kind: 'route_source'; readonly node: RouteAst }
  | { readonly kind: 'controller_source'; readonly node: ControllerAst }
  | { readonly kind: 'response_source'; readonly node: ResponseAst }
  | { readonly kind: 'service_source'; readonly node: ServiceAst }
  | { readonly kind: 'migration_source'; readonly node: MigrationAst }
  | { readonly kind: 'dto_source'; readonly node: DtoAst }
  | { readonly kind: 'middleware_source'; readonly node: MiddlewareAst }
  | { readonly kind: 'provider_source'; readonly node: ProviderAst }
  | { readonly kind: 'attribute_source'; readonly node: AttributeAst };
