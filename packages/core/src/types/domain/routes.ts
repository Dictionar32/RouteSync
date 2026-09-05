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

export interface ParsedRoute {
  readonly name: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly resourceName: string;      // ✅ Guaranteed from PHP scanner
  readonly groupName: string;         // ✅ Canonical Route Group SSOT ('users', 'orderItems')
  readonly crudRole: CrudRole;        // ✅ Canonical REST CRUD Role SSOT ('index' | 'show' | 'create' | 'update' | 'delete' | 'custom')
  readonly runtimePath: string;       // ✅ Express/React Runtime Path SSOT ('/users/:userId')
  readonly responseTypeName: string;  // ✅ Guaranteed from PHP scanner (e.g. 'UsersResponse')
  readonly actionKind: RouteActionKind; // ✅ Guaranteed Action Intent (0 ternary '? :')
  readonly isMutating: boolean;                      // ✅ Guaranteed Mutating Flag (0 '||' checks)
  readonly hookKind: RouteHookKind;                  // ✅ Guaranteed Hook Kind SSOT (Query vs Mutation)
  readonly invalidation: RouteCacheInvalidationDescriptor; // ✅ Guaranteed Cache Invalidation SSOT
  readonly executionSignature: RouteExecutionSignature;   // ✅ Guaranteed Signature SSOT
  readonly requestContentType: RequestContentType;   // ✅ Guaranteed Transport Content-Type SSOT
  readonly parameters: readonly RouteParameter[];    // Backwards-compatible path parameters
  readonly pathParameters: readonly RouteParameter[];// ✅ Dedicated Path Parameters SSOT
  readonly queryParameters: readonly RouteQueryParameter[]; // ✅ Dedicated Query Parameters SSOT
  readonly auth: boolean;
  readonly security: RouteSecurityDescriptor;        // ✅ Guaranteed Security SSOT (0 middleware.some)
  readonly middleware: readonly string[];
  readonly policies: readonly RoutePolicyDescriptor[];// ✅ Dedicated Laravel Policies SSOT ('can:update,order')
  readonly rateLimit: RateLimitDescriptor | null;    // ✅ Dedicated Laravel Rate Limit SSOT ('throttle:60,1')
  readonly response: ResponseDescriptor;             // ◄── 100% Guaranteed Value Object!
  readonly errorResponses: readonly HttpErrorResponseDescriptor[]; // ✅ First-Class Error Descriptors (422, etc.)

  /**
   * Strongly-typed Laravel validation rules payload.
   */
  readonly schema: RouteSchemaPayload;

  /**
   * Local variable assignments tracked during semantic analysis (Ordered Array).
   */
  readonly assignments: readonly ResourceAssignment[];

  readonly sourceFile: string;
  readonly sourceLine: number;
  readonly uri: string;
  readonly actionName: string;
  readonly controllerName: string | null;
  readonly contract?: EndpointContract; // ✅ Complete Contract-Driven Architecture SSOT
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

