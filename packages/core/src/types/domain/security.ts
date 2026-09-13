/**
 * HTTP Vocabulary, Authentication & HTTP Errors Architecture.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 */
export {
    HttpMethod,
    RouteActionKind,
    type HttpMethodSpecification,
    type HttpMethodRegistry,
    HTTP_METHOD_REGISTRY,
    type HttpMethodVisitor,
    matchHttpMethod,
    type RouteActionKindSpecification,
    type RouteActionKindRegistry,
    ROUTE_ACTION_KIND_REGISTRY,
    type RouteActionKindVisitor,
    matchRouteActionKind,
    HttpStatusCode,
    type KnownHttpStatusCode,
    type HttpStatusCodeCategory,
    type HttpStatusCodeSpecification,
    type HttpStatusCodeRegistry,
    HTTP_STATUS_CODE_REGISTRY,
    type HttpStatusCodeVisitor,
    matchHttpStatusCode,
    RequestContentType,
    type BaseRequestContentTypeDescriptor,
    type JsonRequestContentTypeDescriptor,
    type MultipartRequestContentTypeDescriptor,
    type UrlEncodedRequestContentTypeDescriptor,
    type NoneRequestContentTypeDescriptor,
    type RequestContentTypeDescriptor,
    type RequestContentTypeSpecification,
    type RequestContentTypeRegistry,
    REQUEST_CONTENT_TYPE_REGISTRY,
    ScannedRequestContentTypeDescriptor,
    type RequestContentTypeVisitor,
    matchRequestContentType
} from "./httpVocabulary";

export {
    SecuritySchemeKind,
    type RouteSecurityDescriptor,
    type ScannedRouteSecurityParams,
    ScannedRouteSecurityDescriptor,
    RouteSecurityClassifier,
    type SecuritySchemeSpecification,
    type SecuritySchemeRegistry,
    SECURITY_SCHEME_REGISTRY,
    type RouteSecurityVisitor,
    matchRouteSecurity,
    type RateLimitDescriptor,
    RoutePolicyKind,
    type RoutePolicyKindSpecification,
    type RoutePolicyKindRegistry,
    ROUTE_POLICY_REGISTRY,
    type RoutePolicyVisitor,
    matchRoutePolicy,
    type RoutePolicyDescriptor
} from "./authAndPolicy";

export {
    type RouteQueryParameter,
    type LaravelValidationError,
    type LaravelUnauthorizedError,
    type LaravelForbiddenError,
    type LaravelNotFoundError,
    type LaravelServerError,
    HttpErrorKind,
    type HttpErrorKindSpecification,
    type HttpErrorKindRegistry,
    HTTP_ERROR_KIND_REGISTRY,
    type HttpErrorVisitor,
    matchHttpError,
    type HttpErrorResponseDescriptor
} from "./httpErrors";
