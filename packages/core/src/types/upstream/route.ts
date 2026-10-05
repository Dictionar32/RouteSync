import type { ActionName, ClassName, DomainTypeName, ResourceName, RouteName, RoutePath, RouteParameterName, PropertyName, SourceFile } from './names';
import type { ControllerReturnSemantic } from './controller';
import type { Option } from './collections';
import type { EndpointRequestBinding, EndpointResponseBinding } from './endpointBindings';
import type { SourceSpan } from './provenance';
import type { RouteMiddlewares, RouteMethods, RouteParameters, Sequence } from './collections';
import type { MiddlewareName } from './names';
import type { RouteMiddlewareScope } from './routeMiddleware';
import type { StringValue } from './valueObjects';
import type { Presence } from './primitiveVocabulary';
import type { TruthValue, NumberValue, HttpStatusCode } from './valueObjects';
import type { ControllerReference, ModelReference } from './semanticReferences';
import type { InvalidationTarget } from './routeInvalidationVocabulary';
import type { HttpErrorResponse } from './routeErrorVocabulary';
import type { CrudRole, RouteHookKind, RouteActionKind, RequestContentType, RouteExecutionSignature } from './routeExecutionVocabulary';
import type { RouteAst } from './ast';
export interface RouteCacheInvalidation {
  readonly targets: Sequence<InvalidationTarget>;
  readonly queryKeyExpressions: Sequence<StringValue>;
}

export interface RouteCapabilityContract {
  readonly auth: TruthValue;
  readonly security: RouteSecurityDescriptor;
  readonly middleware: RouteMiddlewares;
  readonly policies: Sequence<RoutePolicyDescriptor>;
  readonly rateLimit: RouteRateLimit;
  readonly invalidation: RouteCacheInvalidation;
  readonly crudRole: CrudRole;
  readonly hookKind: RouteHookKind;
  readonly actionKind: RouteActionKind;
  readonly requestContentType: RequestContentType;
  readonly executionSignature: RouteExecutionSignature;
  readonly errorResponses: Sequence<HttpErrorResponse>;
}

/**
 * Complete semantic target of a Laravel route.
 * The target is a closed ADT so consumers do not reconstruct target meaning
 * from controller/action strings.
 */
export type RouteTarget =
  | { readonly kind: 'controller_action'; readonly controller: ControllerReference }
  | { readonly kind: 'controller_invokable'; readonly controller: ControllerReference }
  | { readonly kind: 'closure'; readonly action: ActionName }
  | { readonly kind: 'redirect'; readonly target: import('./expression').Expression; readonly status: HttpStatusCode }
  | { readonly kind: 'view'; readonly view: import('./expression').Expression; readonly data: RouteViewData }
  | { readonly kind: 'fallback'; readonly action: ActionName };
export type RouteMethod = { readonly kind: 'get' } | { readonly kind: 'post' } | { readonly kind: 'put' } | { readonly kind: 'patch' } | { readonly kind: 'delete' } | { readonly kind: 'options' } | { readonly kind: 'head' } | { readonly kind: 'any' } | { readonly kind: 'match'; readonly methods: RouteMethods };
export type RouteMiddleware =
  | { readonly kind: 'direct'; readonly name: MiddlewareName }
  | { readonly kind: 'inherited'; readonly name: MiddlewareName; readonly group: RouteMiddlewareGroupReference };

export interface RouteMiddlewareGroupReference {
  readonly kind: 'route_middleware_group';
  readonly source: SourceSpan;
}
export type RouteParameterLocation =
  | { readonly kind: 'path' }
  | { readonly kind: 'query' }
  | { readonly kind: 'header' };

export type RouteParameterType =
  | { readonly kind: 'string' }
  | { readonly kind: 'integer' }
  | { readonly kind: 'number' }
  | { readonly kind: 'boolean' }
  | { readonly kind: 'uuid' }
  | { readonly kind: 'ulid' }
  | { readonly kind: 'date' }
  | { readonly kind: 'slug' }
  | { readonly kind: 'model'; readonly model: ModelReference };

export type RouteParameterBinding =
  | { readonly kind: 'convention' }
  | { readonly kind: 'implicit_model'; readonly model: ModelReference; readonly field: Option<PropertyName>; readonly scoped: TruthValue; readonly withTrashed: TruthValue }
  | { readonly kind: 'implicit_enum'; readonly type: import('./names').ClassName }
  | { readonly kind: 'explicit'; readonly model: ModelReference; readonly field: Option<PropertyName> }
  | { readonly kind: 'custom'; readonly model: ModelReference; readonly field: Option<PropertyName> };

export type RouteModelBindingFailure =
  | { readonly kind: 'framework_not_found' }
  | { readonly kind: 'custom'; readonly response: ControllerReturnSemantic };

export type RouteModelBindingOptions = {
  readonly kind: 'route_model_binding_options';
  readonly missing: RouteModelBindingFailure;
  readonly scoped: TruthValue;
  readonly withTrashed: TruthValue;
};

export type RouteParameterConstraint =
  | { readonly kind: 'unconstrained' }
  | { readonly kind: 'pattern'; readonly value: StringValue }
  | { readonly kind: 'set'; readonly values: Sequence<StringValue> };

type RouteParameterBase = {
  readonly kind: 'route_parameter';
  readonly name: RouteParameterName;
  readonly propertyName: PropertyName;
  readonly binding: RouteParameterBinding;
  readonly presence: Presence;
  readonly type: RouteParameterType;
  readonly constraint: RouteParameterConstraint;
  readonly modelBinding: RouteModelBindingOptions;
};

export type RouteParameter = RouteParameterBase & { readonly location: RouteParameterLocation };
export type RouteAuthentication =
  | { readonly kind: 'public' }
  | { readonly kind: 'authenticated'; readonly scheme: SecuritySchemeKind; readonly guard: Option<import('./names').GuardName> };
export interface RouteIdentity {
  readonly kind: 'route_identity';
  readonly key: RouteName;
  readonly declaredName: Option<RouteName>;
  readonly method: RouteMethod;
  readonly path: RoutePath;
}

export interface RouteBindings {
  readonly target: RouteTarget;
  readonly parameters: RouteParameters;
  readonly request: EndpointRequestBinding;
  readonly response: EndpointResponseBinding;
}

export interface RouteSecurityContract {
  readonly authentication: RouteAuthentication;
  readonly signature: RouteSignatureRequirement;
}

export interface RouteProvenance {
  readonly source: SourceFile;
  readonly span: SourceSpan;
  readonly fileContext: RouteFileContext;
}

export type RouteFileContext =
  | { readonly kind: 'web_routes' }
  | { readonly kind: 'api_routes' }
  | { readonly kind: 'custom_routes'; readonly file: SourceFile };

export type RouteGroupBindingScope =
  | { readonly kind: 'default' }
  | { readonly kind: 'scoped' }
  | { readonly kind: 'without_scoped' };

export interface RouteGroupContext {
  readonly middlewareMutations: Sequence<RouteMiddlewareMutation>;
  readonly prefix: Option<RoutePath>;
  readonly namePrefix: Option<StringValue>;
  readonly controller: Option<ControllerReference>;
  readonly domain: RouteDomain;
  readonly bindingScope: RouteGroupBindingScope;
  readonly constraints: Sequence<RouteConstraint>;
}

export type RouteSpecialKind =
  | { readonly kind: 'standard' }
  | { readonly kind: 'resource'; readonly resource: RouteResourceRegistration }
  | { readonly kind: 'api_resource'; readonly resource: RouteResourceRegistration }
  | { readonly kind: 'singleton'; readonly resource: RouteResourceRegistration }
  | { readonly kind: 'api_singleton'; readonly resource: RouteResourceRegistration };

/**
 * Complete upstream semantic contract for one route.
 * Identity, bindings, security/capability and provenance are explicit
 * sub-contracts so consumers receive meaning instead of reconstructing it.
 */
export type RouteDomain =
  | { readonly kind: 'default' }
  | { readonly kind: 'explicit'; readonly value: DomainTypeName };

export type RouteViewData =
  | { readonly kind: 'absent' }
  | { readonly kind: 'expression'; readonly value: import('./expression').Expression };

export type RouteResourceRegistration = {
  readonly kind: 'route_resource_registration';
  readonly name: ResourceName;
  readonly controller: RouteResourceController;
  readonly only: Sequence<ActionName>;
  readonly except: Sequence<ActionName>;
  readonly shallow: TruthValue;
  readonly scoped: TruthValue;
  readonly parameters: Sequence<PropertyName>;
  readonly creatable: TruthValue;
  readonly destroyable: TruthValue;
  readonly middleware: Sequence<RouteResourceMiddlewareRule>;
};

export type RouteResourceController =
  | { readonly kind: 'framework_convention' }
  | { readonly kind: 'conventional_controller'; readonly className: ClassName }
  | { readonly kind: 'explicit_controller'; readonly className: ClassName };

export type RouteResourceMiddlewareRule = {
  readonly kind: 'route_resource_middleware';
  readonly scope: RouteMiddlewareScope;
  readonly include: Sequence<MiddlewareName>;
  readonly exclude: Sequence<MiddlewareName>;
};

export type RouteConstraint =
  | { readonly kind: 'unconstrained' }
  | { readonly kind: 'pattern'; readonly parameter: RouteParameterName; readonly value: StringValue }
  | { readonly kind: 'set'; readonly parameter: RouteParameterName; readonly values: Sequence<StringValue> }
  | { readonly kind: 'enum'; readonly parameter: RouteParameterName; readonly type: import('./names').ClassName };

export type RouteSignatureRequirement =
  | { readonly kind: 'not_signed' }
  | { readonly kind: 'signed'; readonly relative: TruthValue };

export type RouteMiddlewareMutation =
  | { readonly kind: 'with'; readonly middleware: Sequence<MiddlewareName> }
  | { readonly kind: 'without'; readonly middleware: Sequence<MiddlewareName> }
  | { readonly kind: 'replace'; readonly middleware: Sequence<MiddlewareName> };

export type RouteDefaultValue = {
  readonly kind: 'route_default';
  readonly parameter: RouteParameterName;
  readonly value: import('./expression').Expression;
};

export type RouteDefaults = {
  readonly kind: 'route_defaults';
  readonly items: Sequence<RouteDefaultValue>;
};

export type RouteTransportContract = {
  readonly kind: 'route_transport';
  readonly httpOnly: TruthValue;
  readonly httpsOnly: TruthValue;
};

/**
 * Upstream construction input for RouteProducer.
 *
 * The route producer deliberately lives on the AST/ADT side of the boundary:
 * it receives the Laravel declaration AST together with already-resolved
 * semantic facts, and constructs the canonical RouteAst. The AST is therefore
 * preserved upstream rather than being removed merely to make an interface
 * artificially AST-free.
 */
/**
 * Canonical semantic boundary contract for route construction.
 * This type belongs to the upstream semantic vocabulary; scanner resolver
 * implementations must not source it from the legacy descriptor tree.
 */
export interface RouteBoundaryContract {
  readonly identity: import('../route').RouteIdentityContract;
  readonly binding: import('../route').RouteBindingContract;
  readonly capability: import('../route').RouteCapabilityContract;
  readonly provenance: import('../route').RouteProvenanceContract;
  readonly contract: import('../route').EndpointContract;
}

export interface RouteProducerInput {
  readonly declaration: import('./routeDeclarationEvidence').RouteDeclarationEvidence;
  readonly source: SourceSpan;
  readonly identity: RouteIdentity;
  readonly special: RouteSpecialKind;
  readonly domain: RouteDomain;
  readonly group: RouteGroupContext;
  readonly bindings: RouteBindings;
  readonly returnSemantic: ControllerReturnSemantic;
  readonly security: RouteSecurityContract;
  readonly capability: RouteCapabilityContract;
  readonly defaults: RouteDefaults;
  readonly transport: RouteTransportContract;
  readonly provenance: RouteProvenance;
}

export interface RouteProducer {
  /** Constructs the canonical upstream RouteAst from AST provenance plus semantic ADTs. */
  readonly produce: (input: RouteProducerInput) => RouteAst;
}

export interface RouteDefinition {
  readonly kind: 'route';
  readonly identity: RouteIdentity;
  readonly special: RouteSpecialKind;
  readonly domain: RouteDomain;
  readonly group: RouteGroupContext;
  readonly bindings: RouteBindings;
  readonly returnSemantic: ControllerReturnSemantic;
  readonly security: RouteSecurityContract;
  readonly capability: RouteCapabilityContract;
  readonly defaults: RouteDefaults;
  readonly transport: RouteTransportContract;
  readonly provenance: RouteProvenance;
}

export const SecuritySchemeKind = Object.freeze({
  Sanctum: 'sanctum', Bearer: 'bearer', Cookie: 'cookie', Public: 'public'
} as const);
export type SecuritySchemeKind = typeof SecuritySchemeKind[keyof typeof SecuritySchemeKind];

export interface RouteSecurityDescriptor {
  readonly isProtected: TruthValue;
  readonly scheme: SecuritySchemeKind;
  readonly guards: Sequence<import('./names').GuardName>;
  readonly abilities: Sequence<import('./names').AbilityName>;
}

export const createRouteSecurityDescriptor = (
  isProtected: TruthValue,
  scheme: SecuritySchemeKind,
  guards: Sequence<import('./names').GuardName>,
  abilities: Sequence<import('./names').AbilityName>,
): RouteSecurityDescriptor => Object.freeze({ isProtected, scheme, guards, abilities });

export type RouteRateLimit =
  | { readonly kind: 'none' }
  | { readonly kind: 'fixed'; readonly limit: RateLimitDescriptor }
  | { readonly kind: 'named'; readonly name: import('./names').Name }
  | { readonly kind: 'multiple'; readonly limits: Sequence<RateLimitDescriptor> };

export type RateLimitDescriptor =
  | { readonly kind: 'fixed'; readonly maxAttempts: NumberValue; readonly decayMinutes: NumberValue }
  | { readonly kind: 'named'; readonly name: import('./names').Name };


export const RoutePolicyKind = Object.freeze({
  AbilityModel: 'ability_model', Gate: 'gate', Custom: 'custom'
} as const);
export type RoutePolicyKind = typeof RoutePolicyKind[keyof typeof RoutePolicyKind];

export type RoutePolicyDescriptor =
  | { readonly kind: typeof RoutePolicyKind.AbilityModel; readonly ability: import('./names').AbilityName; readonly modelParameter: PropertyName }
  | { readonly kind: typeof RoutePolicyKind.Gate; readonly ability: import('./names').AbilityName; readonly modelParameter: { readonly kind: 'none' } }
  | { readonly kind: typeof RoutePolicyKind.Custom; readonly ability: import('./names').AbilityName; readonly modelParameter: { readonly kind: 'none' } | { readonly kind: 'parameter'; readonly name: PropertyName } };
