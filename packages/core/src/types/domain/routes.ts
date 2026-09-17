import type { EndpointContract } from "./contracts";
import type { ResourceAssignment } from "./expressions";
import {
  type CrudRole,
  type RouteCacheInvalidationDescriptor,
  type RouteExecutionSignature,
  RouteHookKind
} from "./lifecycle";
import type { RouteParameter } from "./parameters";
import type { ResponseDescriptor } from "./responses";
import type {
  HttpErrorResponseDescriptor,
  HttpMethod,
  RateLimitDescriptor,
  RequestContentType,
  RouteActionKind,
  RoutePolicyDescriptor,
  RouteQueryParameter,
  RouteSecurityDescriptor
} from "./security";
import type { RouteSchemaPayload } from "./validation";
import type { RouteHandlerDescriptor, FormRequestDescriptor } from "./routeHandlers";
import type { ActionName, ControllerName, DomainName, ResourceName, ResponseTypeName, RouteName, RoutePath, SourceFilePath, SourceLineNumber, PropertyName } from "./semanticValues";

/**
 * Route Parameter Specification Contract.
 * Enforces structured partitioning between path and query parameters (0 '?', 0 fallback).
 */
export interface RouteParameterSpecification {
  readonly all: readonly RouteParameter[];
  readonly path: readonly RouteParameter[];
  readonly query: readonly RouteQueryParameter[];
}

/**
 * Closed Route Identity Sub-Contract.
 * Enforces guaranteed identity and network coordinates (0 '?', 0 fallback).
 */
export interface RouteIdentityContract {
  readonly name: RouteName;
  readonly method: HttpMethod;
  readonly path: RoutePath;
  readonly runtimePath: RoutePath;
  readonly constantKey: PropertyName;
  readonly resourceName: ResourceName;
  readonly domain: DomainName;
  readonly groupName: DomainName;
  readonly parameters: RouteParameterSpecification;
}

/**
 * Closed Route Binding Sub-Contract.
 * Enforces guaranteed handler binding, schema payload, and controller target (0 '?', 0 fallback).
 */
export interface RouteBindingContract {
  readonly handler: RouteHandlerDescriptor;
  readonly action: ActionName;
  readonly actionName: ActionName;
  readonly controllerName: ControllerName;
  readonly schema: RouteSchemaPayload;
  readonly response: ResponseDescriptor;
  readonly responseTypeName: ResponseTypeName;
  readonly formRequests: readonly FormRequestDescriptor[];
  readonly assignments: readonly ResourceAssignment[];
}

/**
 * Closed Route Capability Sub-Contract.
 * Enforces guaranteed transport capabilities, security, invalidation, and lifecycle semantics (0 '?', 0 fallback).
 */
export interface RouteCapabilityContract {
  readonly auth: boolean;
  readonly security: RouteSecurityDescriptor;
  readonly middleware: readonly PropertyName[];
  readonly policies: readonly RoutePolicyDescriptor[];
  readonly rateLimit: RateLimitDescriptor | null;
  readonly invalidation: RouteCacheInvalidationDescriptor;
  readonly crudRole: CrudRole;
  readonly hookKind: RouteHookKind;
  readonly actionKind: RouteActionKind;
  readonly isMutating: boolean;
  readonly requestContentType: RequestContentType;
  readonly executionSignature: RouteExecutionSignature;
  readonly errorResponses: readonly HttpErrorResponseDescriptor[];
}

/**
 * Closed Route Provenance Sub-Contract.
 * Enforces end-to-end traceability back to PHP Laravel source location (0 '?', 0 fallback).
 */
export interface RouteProvenanceContract {
  readonly sourceFile: SourceFilePath;
  readonly sourceLine: SourceLineNumber;
  readonly uri: RoutePath;
}

export interface ParsedRoute {
  /**
   * Canonical route model. All route semantics live in closed sub-contracts.
   * Consumers must read identity, binding, capability and provenance rather
   * than a second flat copy of the same information.
   */
  readonly identity: RouteIdentityContract;
  readonly binding: RouteBindingContract;
  readonly capability: RouteCapabilityContract;
  readonly provenance: RouteProvenanceContract;
  readonly contract: EndpointContract;
}


// ============================================================================
// ROUTE DESCRIPTOR ADT (Direct Extension of ParsedRoute — 100% Data Connected)
// ============================================================================

export interface GetCollectionRouteDescriptor extends ParsedRoute {
  readonly kind: 'get_collection';
  readonly method: 'GET';
}

export interface GetItemRouteDescriptor extends ParsedRoute {
  readonly kind: 'get_item';
  readonly method: 'GET';
}

export interface MutationRouteDescriptor extends ParsedRoute {
  readonly kind: 'mutation';
  readonly method: 'POST' | 'PUT' | 'PATCH';
}

export interface DeletionRouteDescriptor extends ParsedRoute {
  readonly kind: 'deletion';
  readonly method: 'DELETE';
}

export type RouteDescriptor =
  | GetCollectionRouteDescriptor
  | GetItemRouteDescriptor
  | MutationRouteDescriptor
  | DeletionRouteDescriptor;

export type RouteClassifier = (route: ParsedRoute) => RouteDescriptor;

export const CRUD_DISPATCH_REGISTRY: Record<CrudRole, RouteClassifier> = Object.freeze({
  index: (route): GetCollectionRouteDescriptor => ({
    ...route,
    kind: 'get_collection',
    method: 'GET',
  }),

  show: (route): GetItemRouteDescriptor => ({
    ...route,
    kind: 'get_item',
    method: 'GET',
  }),

  create: (route): MutationRouteDescriptor => ({
    ...route,
    kind: 'mutation',
    method: route.method as 'POST' | 'PUT' | 'PATCH',
  }),

  update: (route): MutationRouteDescriptor => ({
    ...route,
    kind: 'mutation',
    method: route.method as 'POST' | 'PUT' | 'PATCH',
  }),

  delete: (route): DeletionRouteDescriptor => ({
    ...route,
    kind: 'deletion',
    method: 'DELETE',
  }),

  custom: (route): RouteDescriptor => {
    const CUSTOM_DISPATCH: Record<RouteHookKind, RouteClassifier> = {
      [RouteHookKind.Query]: CRUD_DISPATCH_REGISTRY.index,
      [RouteHookKind.Mutation]: CRUD_DISPATCH_REGISTRY.create,
      [RouteHookKind.InfiniteQuery]: CRUD_DISPATCH_REGISTRY.index,
    };
    return CUSTOM_DISPATCH[route.hookKind](route);
  },
});

/**
 * 0 `if` Classifier: Mengonversi ParsedRoute menjadi RouteDescriptor ADT utuh
 */
export const classifyRoute = (route: ParsedRoute): RouteDescriptor =>
  CRUD_DISPATCH_REGISTRY[route.crudRole](route);

export interface RouteVisitor<R> {
  readonly get_collection: (desc: GetCollectionRouteDescriptor) => R;
  readonly get_item: (desc: GetItemRouteDescriptor) => R;
  readonly mutation: (desc: MutationRouteDescriptor) => R;
  readonly deletion: (desc: DeletionRouteDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian dengan exhaustive type safety
 */
export function matchRoute<R>(
  descriptor: RouteDescriptor,
  visitor: RouteVisitor<R>
): R {
  return visitor[descriptor.kind](descriptor as any);
}

/**
 * RouteDescriptorKind
 *
 * Canonical Domain Vocabulary for Route ADT Discriminator Tags.
 */
export const RouteDescriptorKind = Object.freeze({
  GetCollection: 'get_collection',
  GetItem: 'get_item',
  Mutation: 'mutation',
  Deletion: 'deletion',
} as const);

export type RouteDescriptorKind = typeof RouteDescriptorKind[keyof typeof RouteDescriptorKind];

export interface RouteKindSpecification<K extends RouteDescriptorKind = RouteDescriptorKind> {
  readonly kind: K;
  readonly hookKind: RouteHookKind;
  readonly isMutating: boolean;
  readonly allowsPayload: boolean;
}

export type RouteDescriptorRegistry = {
  readonly [K in RouteDescriptorKind]: RouteKindSpecification<K>;
};

export const ROUTE_DESCRIPTOR_REGISTRY: RouteDescriptorRegistry = Object.freeze({
  [RouteDescriptorKind.GetCollection]: {
    kind: RouteDescriptorKind.GetCollection,
    hookKind: RouteHookKind.Query,
    isMutating: false,
    allowsPayload: false,
  },
  [RouteDescriptorKind.GetItem]: {
    kind: RouteDescriptorKind.GetItem,
    hookKind: RouteHookKind.Query,
    isMutating: false,
    allowsPayload: false,
  },
  [RouteDescriptorKind.Mutation]: {
    kind: RouteDescriptorKind.Mutation,
    hookKind: RouteHookKind.Mutation,
    isMutating: true,
    allowsPayload: true,
  },
  [RouteDescriptorKind.Deletion]: {
    kind: RouteDescriptorKind.Deletion,
    hookKind: RouteHookKind.Mutation,
    isMutating: true,
    allowsPayload: false,
  },
});

/**
 * RouteCollectionRegistry
 *
 * Immutable First-Class Partition Registry for Scanned Route Descriptors.
 */
export interface RouteCollectionRegistry {
  readonly all: readonly RouteDescriptor[];
  readonly collections: readonly GetCollectionRouteDescriptor[];
  readonly items: readonly GetItemRouteDescriptor[];
  readonly mutations: readonly MutationRouteDescriptor[];
  readonly deletions: readonly DeletionRouteDescriptor[];
  matchAll<R>(visitor: RouteVisitor<R>): readonly R[];
}

export class ScannedRouteRegistry implements RouteCollectionRegistry {
  public readonly all: readonly RouteDescriptor[];
  public readonly collections: readonly GetCollectionRouteDescriptor[];
  public readonly items: readonly GetItemRouteDescriptor[];
  public readonly mutations: readonly MutationRouteDescriptor[];
  public readonly deletions: readonly DeletionRouteDescriptor[];

  constructor({
    all,
    collections,
    items,
    mutations,
    deletions
  }: {
    readonly all: readonly RouteDescriptor[];
    readonly collections: readonly GetCollectionRouteDescriptor[];
    readonly items: readonly GetItemRouteDescriptor[];
    readonly mutations: readonly MutationRouteDescriptor[];
    readonly deletions: readonly DeletionRouteDescriptor[];
  }) {
    this.all = all;
    this.collections = collections;
    this.items = items;
    this.mutations = mutations;
    this.deletions = deletions;
    Object.freeze(this);
  }

  public static fromRoutes(routes: readonly ParsedRoute[]): ScannedRouteRegistry {
    const all = routes.map(classifyRoute);
    const collections: GetCollectionRouteDescriptor[] = [];
    const items: GetItemRouteDescriptor[] = [];
    const mutations: MutationRouteDescriptor[] = [];
    const deletions: DeletionRouteDescriptor[] = [];

    const PARTITION_DISPATCH: RouteVisitor<void> = {
      get_collection: (d) => { collections.push(d); },
      get_item: (d) => { items.push(d); },
      mutation: (d) => { mutations.push(d); },
      deletion: (d) => { deletions.push(d); }
    };

    all.forEach(desc => matchRoute(desc, PARTITION_DISPATCH));

    return new ScannedRouteRegistry({
      all: Object.freeze(all),
      collections: Object.freeze(collections),
      items: Object.freeze(items),
      mutations: Object.freeze(mutations),
      deletions: Object.freeze(deletions)
    });
  }

  public matchAll<R>(visitor: RouteVisitor<R>): readonly R[] {
    return this.all.map(desc => matchRoute(desc, visitor));
  }
}

