/**
 * CRUD Roles, Cache Invalidation & Execution Signatures Architecture.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 */
export {
    CrudRole,
    PageEndpointKind,
    type PageEndpointKindSpecification,
    type PageEndpointKindRegistry,
    PAGE_ENDPOINT_REGISTRY,
    type PageEndpointDescriptor,
    type PageEndpointVisitor,
    matchPageEndpoint,
    RouteHookKind,
    type BaseRouteHookDescriptor,
    type QueryHookDescriptor,
    type MutationHookDescriptor,
    type InfiniteQueryHookDescriptor,
    type AnyRouteHookDescriptor,
    type RouteHookDescriptor,
    type HookKindSpecification,
    type HookKindRegistry,
    HOOK_KIND_REGISTRY,
    type RouteHookKindVisitor,
    matchRouteHookKind,
    matchHookKind,
    ScannedRouteHookDescriptor,
    type BaseCrudRoleDescriptor,
    type IndexCrudRoleDescriptor,
    type ShowCrudRoleDescriptor,
    type CreateCrudRoleDescriptor,
    type UpdateCrudRoleDescriptor,
    type DeleteCrudRoleDescriptor,
    type CustomCrudRoleDescriptor,
    type AnyCrudRoleDescriptor,
    type CrudRoleSpecification,
    type CrudRoleRegistry,
    CRUD_ROLE_REGISTRY,
    type CrudRoleVisitor,
    matchCrudRole,
    ScannedCrudRoleDescriptor,
    SdkResponseKind
} from "./crudRoles";

export {
    InvalidationTargetKind,
    type InvalidationTarget,
    type SelfListInvalidationTarget,
    type ParentListInvalidationTarget,
    type ParentDetailInvalidationTarget,
    type AuthResourceInvalidationTarget,
    type AnyInvalidationTarget,
    type InvalidationTargetSpecification,
    type InvalidationTargetRegistry,
    INVALIDATION_TARGET_REGISTRY,
    type InvalidationTargetVisitor,
    matchInvalidationTarget,
    ScannedInvalidationTarget,
    type RouteCacheInvalidationDescriptor,
    ScannedRouteCacheInvalidationDescriptor,
    ScannedRouteInvalidationPayload
} from "./cacheInvalidation";

export {
    RoutePayloadMode,
    type BaseRouteExecutionSignature,
    type NoPayloadExecutionSignature,
    type RequiredPayloadExecutionSignature,
    type OptionalPayloadExecutionSignature,
    type AnyRouteExecutionSignature,
    type RouteExecutionSignature,
    type RoutePayloadModeSpecification,
    type RoutePayloadModeRegistry,
    ROUTE_PAYLOAD_MODE_REGISTRY,
    type RouteExecutionSignatureVisitor,
    matchRouteExecutionSignature,
    matchRoutePayloadMode,
    ScannedRouteExecutionSignature
} from "./executionSignatures";

