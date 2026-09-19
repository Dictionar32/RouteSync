import type { ActionName, ControllerName, DomainTypeName, RouteName, RoutePath, RouteParameterName, PropertyName } from './names';
import type { ResponseContract } from './response';
import type { SourceFile } from './names';
import type { SourceSpan } from './provenance';
import type { RouteMiddlewares, RouteMethods, RouteParameters } from './collections';
import type { MiddlewareName } from './names';
import type { StringValue } from './valueObjects';
import type { Presence } from './primitiveVocabulary';
export type RouteTarget = { readonly kind: 'controller'; readonly controller: ControllerName; readonly action: ActionName } | { readonly kind: 'closure'; readonly action: ActionName };
export type RouteMethod = { readonly kind: 'get' } | { readonly kind: 'post' } | { readonly kind: 'put' } | { readonly kind: 'patch' } | { readonly kind: 'delete' } | { readonly kind: 'options' } | { readonly kind: 'head' } | { readonly kind: 'match'; readonly methods: RouteMethods };
export type RouteMiddleware = { readonly kind: 'middleware'; readonly name: MiddlewareName };
export type RouteParameterLocation = 'path' | 'query' | 'header';

export type RouteParameterType = 'string' | 'number' | 'boolean' | 'uuid' | 'ulid' | 'date' | 'slug';

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

export type RouteParameter =
  | (RouteParameterBase & { readonly location: 'path' })
  | (RouteParameterBase & { readonly location: 'query' })
  | (RouteParameterBase & { readonly location: 'header' });
export type RouteAuthentication = { readonly kind: 'public' } | { readonly kind: 'authenticated' };
export type RouteDefinition = { readonly kind: 'route'; readonly name: RouteName; readonly methods: RouteMethods; readonly path: RoutePath; readonly target: RouteTarget; readonly domain: DomainTypeName; readonly auth: RouteAuthentication; readonly middleware: RouteMiddlewares; readonly parameters: RouteParameters; readonly response: ResponseContract; readonly source: SourceFile; readonly span: SourceSpan };
