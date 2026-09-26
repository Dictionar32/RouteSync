import type { ActionName, DomainTypeName, RouteName, RoutePath, RouteParameterName, PropertyName } from './names';
import type { RouteAst } from './ast';
import type { ControllerReturnSemantic } from './controller';
import type { Option } from './collections';
import type { EndpointRequestBinding, EndpointResponseBinding } from './endpointBindings';
import type { SourceFile } from './names';
import type { SourceSpan } from './provenance';
import type { RouteMiddlewares, RouteMethods, RouteParameters, Sequence } from './collections';
import type { MiddlewareName } from './names';
import type { StringValue } from './valueObjects';
import type { Presence } from './primitiveVocabulary';
import type { TruthValue, NumberValue, HttpStatusCode } from './valueObjects';
import type { ControllerReference, ModelReference } from './semanticReferences';
import type { InvalidationTarget } from './routeInvalidationVocabulary';
import type { HttpErrorResponse } from './routeErrorVocabulary';
import type { CrudRole, RouteHookKind, RouteActionKind, RequestContentType, RouteExecutionSignature } from './routeExecutionVocabulary';
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
export type RouteFacts = {
  readonly kind: 'route_facts';
  readonly identity: import('./semanticReferences').RouteReference;
  readonly domain: RouteDomain;
  readonly endpoint: import('./highLevelContracts').RouteEndpointContract;
  readonly source: SourceSpan;
};

export interface RouteIdentity {
  readonly kind: 'route_identity';
  readonly name: RouteName;
  readonly method: RouteMethod;
  readonly methods: RouteMethods;
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
  readonly middleware: RouteMiddlewares;
  readonly security: RouteSecurityDescriptor;
  readonly signature: RouteSignatureRequirement;
}

export interface RouteProvenance {
  readonly source: SourceFile;
  readonly span: SourceSpan;
}

export type RouteGroupBindingScope =
  | { readonly kind: 'default' }
  | { readonly kind: 'scoped' }
  | { readonly kind: 'without_scoped' };

export interface RouteGroupContext {
  readonly middleware: RouteMiddlewares;
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
  | { readonly kind: 'fallback' }
  | { readonly kind: 'redirect' }
  | { readonly kind: 'permanent_redirect' }
  | { readonly kind: 'view' }
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
  readonly name: import('./names').Name;
  readonly controller: ControllerReference;
  readonly only: Sequence<ActionName>;
  readonly except: Sequence<ActionName>;
  readonly shallow: TruthValue;
  readonly scoped: TruthValue;
  readonly parameters: Sequence<PropertyName>;
  readonly creatable: TruthValue;
  readonly destroyable: TruthValue;
  readonly middleware: Sequence<RouteResourceMiddlewareRule>;
};

export type RouteResourceMiddlewareRule = {
  readonly kind: 'route_resource_middleware';
  readonly actions: Sequence<ActionName>;
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
 * Semantic input boundary for RouteProducer.
 *
 * The producer receives source declaration syntax plus already-owned upstream
 * facts from the Request/Response/Controller/Model producers. It must compose
 * those facts into RouteDefinition without re-classifying their meaning.
 */
export interface RouteProducerInput {
  readonly declaration: import('../../compiler/scanner/lexer/routeAst').RouteDeclarationAst;
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
  readonly produce: (input: RouteProducerInput) => RouteAst;
}

export type RouteDefinition = {
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
};

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
