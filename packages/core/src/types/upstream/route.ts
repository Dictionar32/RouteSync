import type { ActionName, DomainTypeName, RouteName, RoutePath, RouteParameterName, PropertyName } from './names';
import type { ResponseReference } from './semanticReferences';
import type { EndpointRequestBinding } from './endpointBindings';
import type { SourceFile } from './names';
import type { SourceSpan } from './provenance';
import type { RouteMiddlewares, RouteMethods, RouteParameters } from './collections';
import type { MiddlewareName } from './names';
import type { StringValue } from './valueObjects';
import type { Presence } from './primitiveVocabulary';
import type { TruthValue, NumberValue } from './valueObjects';
import type { ControllerReference } from './semanticReferences';
import type { InvalidationTarget } from './routeInvalidationVocabulary';
import type { HttpErrorResponse } from './routeErrorVocabulary';
import type { CrudRole, RouteHookKind, RouteActionKind, RequestContentType, RouteExecutionSignature } from './routeExecutionVocabulary';
export interface RouteCacheInvalidation {
  readonly targets: readonly InvalidationTarget[];
  readonly queryKeyExpressions: readonly StringValue[];
}

export interface RouteCapabilityContract {
  readonly auth: TruthValue;
  readonly security: RouteSecurityDescriptor;
  readonly middleware: readonly PropertyName[];
  readonly policies: readonly RoutePolicyDescriptor[];
  readonly rateLimit: RateLimitDescriptor | null;
  readonly invalidation: RouteCacheInvalidation;
  readonly crudRole: CrudRole;
  readonly hookKind: RouteHookKind;
  readonly actionKind: RouteActionKind;
  readonly requestContentType: RequestContentType;
  readonly executionSignature: RouteExecutionSignature;
  readonly errorResponses: readonly HttpErrorResponse[];
}

export type RouteTarget = { readonly kind: 'controller'; readonly controller: ControllerReference } | { readonly kind: 'closure'; readonly action: ActionName };
export type RouteMethod = { readonly kind: 'get' } | { readonly kind: 'post' } | { readonly kind: 'put' } | { readonly kind: 'patch' } | { readonly kind: 'delete' } | { readonly kind: 'options' } | { readonly kind: 'head' } | { readonly kind: 'match'; readonly methods: RouteMethods };
export type RouteMiddleware = { readonly kind: 'middleware'; readonly name: MiddlewareName };
export type RouteParameterLocation =
  | { readonly kind: 'path' }
  | { readonly kind: 'query' }
  | { readonly kind: 'header' };

export type RouteParameterType =
  | { readonly kind: 'string' }
  | { readonly kind: 'number' }
  | { readonly kind: 'boolean' }
  | { readonly kind: 'uuid' }
  | { readonly kind: 'ulid' }
  | { readonly kind: 'date' }
  | { readonly kind: 'slug' };

export type RouteParameterBinding =
  | { readonly kind: 'convention' }
  | { readonly kind: 'explicit'; readonly field: PropertyName };

export type RouteParameterConstraint =
  | { readonly kind: 'unconstrained' }
  | { readonly kind: 'pattern'; readonly value: StringValue };

type RouteParameterBase = {
  readonly kind: 'route_parameter';
  readonly name: RouteParameterName;
  readonly propertyName: PropertyName;
  readonly binding: RouteParameterBinding;
  readonly presence: Presence;
  readonly type: RouteParameterType;
  readonly constraint: RouteParameterConstraint;
};

export type RouteParameter = RouteParameterBase & { readonly location: RouteParameterLocation };
export type RouteAuthentication = { readonly kind: 'public' } | { readonly kind: 'authenticated' };
export type RouteFacts = {
  readonly kind: 'route_facts';
  readonly identity: import('./semanticReferences').RouteReference;
  readonly domain: DomainTypeName;
  readonly endpoint: import('./highLevelContracts').RouteEndpointContract;
  readonly response: ResponseReference;
  readonly source: SourceSpan;
};

export type RouteDefinition = { readonly kind: 'route'; readonly name: RouteName; readonly method: RouteMethod; readonly methods: RouteMethods; readonly path: RoutePath; readonly target: RouteTarget; readonly domain: DomainTypeName; readonly auth: RouteAuthentication; readonly middleware: RouteMiddlewares; readonly parameters: RouteParameters; readonly request: EndpointRequestBinding; readonly response: ResponseReference; readonly capability: RouteCapabilityContract; readonly source: SourceFile; readonly span: SourceSpan };

export const SecuritySchemeKind = Object.freeze({
  Sanctum: 'sanctum', Bearer: 'bearer', Cookie: 'cookie', Public: 'public'
} as const);
export type SecuritySchemeKind = typeof SecuritySchemeKind[keyof typeof SecuritySchemeKind];

export interface RouteSecurityDescriptor {
  readonly isProtected: TruthValue;
  readonly scheme: SecuritySchemeKind;
  readonly guards: readonly import('./names').GuardName[];
  readonly abilities: readonly import('./names').AbilityName[];
}

export interface RateLimitDescriptor {
  readonly maxAttempts: NumberValue;
  readonly decayMinutes: NumberValue;
}

export const RoutePolicyKind = Object.freeze({
  AbilityModel: 'ability_model', Gate: 'gate', Custom: 'custom'
} as const);
export type RoutePolicyKind = typeof RoutePolicyKind[keyof typeof RoutePolicyKind];

export type RoutePolicyDescriptor =
  | { readonly kind: typeof RoutePolicyKind.AbilityModel; readonly ability: import('./names').AbilityName; readonly modelParameter: PropertyName }
  | { readonly kind: typeof RoutePolicyKind.Gate; readonly ability: import('./names').AbilityName; readonly modelParameter: { readonly kind: 'none' } }
  | { readonly kind: typeof RoutePolicyKind.Custom; readonly ability: import('./names').AbilityName; readonly modelParameter: { readonly kind: 'none' } | { readonly kind: 'parameter'; readonly name: PropertyName } };
