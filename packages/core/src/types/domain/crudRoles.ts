import { CrudRole, RouteHookKind, RouteActionKind, HttpMethod } from '../upstream/routeExecutionVocabulary';
import type { RoutePath, PropertyName, RouteParameterName } from '../upstream/names';
export { CrudRole, RouteHookKind } from '../upstream/routeExecutionVocabulary';
export type { CrudRole, RouteHookKind } from '../upstream/routeExecutionVocabulary';
/**
 * PageEndpointKind
 *
 * Canonical ADT discriminator for Page Route Endpoints.
 */
export const PageEndpointKind = Object.freeze({
  Static: 'static',
  Parameterized: 'parameterized',
  QueryFiltered: 'query_filtered'
} as const);

export type PageEndpointKind = typeof PageEndpointKind[keyof typeof PageEndpointKind];

export interface PageEndpointKindSpecification<K extends PageEndpointKind = PageEndpointKind> {
  readonly kind: K;
  readonly isCallable: boolean;
  readonly description: string;
}

export type PageEndpointKindRegistry = {
  readonly [K in PageEndpointKind]: PageEndpointKindSpecification<K>;
};

export const PAGE_ENDPOINT_REGISTRY: PageEndpointKindRegistry = Object.freeze({
  [PageEndpointKind.Static]: {
    kind: PageEndpointKind.Static,
    isCallable: false,
    description: 'Static page route without path or query parameters'
  },
  [PageEndpointKind.Parameterized]: {
    kind: PageEndpointKind.Parameterized,
    isCallable: true,
    description: 'Parameterized page route with required path parameters'
  },
  [PageEndpointKind.QueryFiltered]: {
    kind: PageEndpointKind.QueryFiltered,
    isCallable: true,
    description: 'Page route with optional query parameters and optional/required path parameters'
  }
});

export interface PageEndpointDescriptor {
  readonly kind: PageEndpointKind;
  readonly path: RoutePath;
  readonly query: readonly PropertyName[];
  readonly params: readonly RouteParameterName[];
}

export interface PageEndpointVisitor<R> {
  readonly static: (endpoint: PageEndpointDescriptor) => R;
  readonly parameterized: (endpoint: PageEndpointDescriptor) => R;
  readonly query_filtered: (endpoint: PageEndpointDescriptor) => R;
}

/**
 * Pure dispatch over a complete PageEndpointDescriptor.
 * Classification and endpoint data must already be complete at the origin boundary.
 */
export function matchPageEndpoint<R>(
  endpoint: PageEndpointDescriptor,
  visitor: PageEndpointVisitor<R>
): R {
  switch (endpoint.kind) {
    case PageEndpointKind.Static:
      return visitor.static(endpoint);
    case PageEndpointKind.Parameterized:
      return visitor.parameterized(endpoint);
    case PageEndpointKind.QueryFiltered:
      return visitor.query_filtered(endpoint);
  }
}


// =========================================================================
// EXPLICIT COMPILER ENUMS & DOMAIN MODELS (SSOT ORIGIN BOUNDARY)
// =========================================================================



export interface BaseRouteHookDescriptor<K extends RouteHookKind = RouteHookKind> {
  readonly kind: K;
  readonly hookPrefix: string;          // 'use'
  readonly tanstackHookName: string;    // 'useQuery' | 'useMutation' | 'useInfiniteQuery'
  readonly isMutating: boolean;         // false | true | false
  readonly requiresQueryKey: boolean;   // true | false | true
  readonly supportsPagination: boolean; // false | false | true
}

export interface QueryHookDescriptor extends BaseRouteHookDescriptor<'query'> {
  readonly kind: 'query';
  readonly tanstackHookName: 'useQuery';
  readonly isMutating: false;
  readonly requiresQueryKey: true;
  readonly supportsPagination: false;
}

export interface MutationHookDescriptor extends BaseRouteHookDescriptor<'mutation'> {
  readonly kind: 'mutation';
  readonly tanstackHookName: 'useMutation';
  readonly isMutating: true;
  readonly requiresQueryKey: false;
  readonly supportsPagination: false;
}

export interface InfiniteQueryHookDescriptor extends BaseRouteHookDescriptor<'infinite_query'> {
  readonly kind: 'infinite_query';
  readonly tanstackHookName: 'useInfiniteQuery';
  readonly isMutating: false;
  readonly requiresQueryKey: true;
  readonly supportsPagination: true;
}

export type AnyRouteHookDescriptor =
  | QueryHookDescriptor
  | MutationHookDescriptor
  | InfiniteQueryHookDescriptor;

export type RouteHookDescriptor<K extends RouteHookKind = RouteHookKind> =
  Extract<AnyRouteHookDescriptor, { readonly kind: K }>;

export type HookKindSpecification<K extends RouteHookKind = RouteHookKind> =
  Pick<Extract<AnyRouteHookDescriptor, { readonly kind: K }>,
    'kind' |
    'hookPrefix' |
    'tanstackHookName' |
    'isMutating' |
    'requiresQueryKey' |
    'supportsPagination'
  > & {
    readonly defaultOptionsTypeName: string;
  };

export type HookKindRegistry = {
  readonly [K in RouteHookKind]: HookKindSpecification<K>;
};

export const HOOK_KIND_REGISTRY: HookKindRegistry = Object.freeze({
  [RouteHookKind.Query]: {
    kind: RouteHookKind.Query,
    hookPrefix: 'use',
    tanstackHookName: 'useQuery',
    isMutating: false,
    requiresQueryKey: true,
    supportsPagination: false,
    defaultOptionsTypeName: 'UseQueryOptions'
  },
  [RouteHookKind.Mutation]: {
    kind: RouteHookKind.Mutation,
    hookPrefix: 'use',
    tanstackHookName: 'useMutation',
    isMutating: true,
    requiresQueryKey: false,
    supportsPagination: false,
    defaultOptionsTypeName: 'UseMutationOptions'
  },
  [RouteHookKind.InfiniteQuery]: {
    kind: RouteHookKind.InfiniteQuery,
    hookPrefix: 'use',
    tanstackHookName: 'useInfiniteQuery',
    isMutating: false,
    requiresQueryKey: true,
    supportsPagination: true,
    defaultOptionsTypeName: 'UseInfiniteQueryOptions'
  }
});

export type RouteHookKindVisitor<R> = {
  readonly [K in RouteHookKind]: (spec: HookKindSpecification<K>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian RouteHookKind dengan exhaustive type safety
 */
export function matchRouteHookKind<R>(
  kind: RouteHookKind,
  visitor: RouteHookKindVisitor<R>
): R {
  switch (kind) {
    case RouteHookKind.Query:
      return visitor.query(HOOK_KIND_REGISTRY[RouteHookKind.Query]);
    case RouteHookKind.Mutation:
      return visitor.mutation(HOOK_KIND_REGISTRY[RouteHookKind.Mutation]);
    case RouteHookKind.InfiniteQuery:
      return visitor.infinite_query(HOOK_KIND_REGISTRY[RouteHookKind.InfiniteQuery]);
  }
}

export const matchHookKind = matchRouteHookKind;

export class ScannedRouteHookDescriptor<K extends RouteHookKind = RouteHookKind>
  implements BaseRouteHookDescriptor<K> {
  public readonly kind: K;
  public readonly hookPrefix: HookKindSpecification<K>['hookPrefix'];
  public readonly tanstackHookName: HookKindSpecification<K>['tanstackHookName'];
  public readonly isMutating: HookKindSpecification<K>['isMutating'];
  public readonly requiresQueryKey: HookKindSpecification<K>['requiresQueryKey'];
  public readonly supportsPagination: HookKindSpecification<K>['supportsPagination'];

  constructor(kind: K) {
    this.kind = kind;
    const spec = HOOK_KIND_REGISTRY[kind];
    this.hookPrefix = spec.hookPrefix;
    this.tanstackHookName = spec.tanstackHookName;
    this.isMutating = spec.isMutating;
    this.requiresQueryKey = spec.requiresQueryKey;
    this.supportsPagination = spec.supportsPagination;
    Object.freeze(this);
  }

  public static query(): QueryHookDescriptor {
    return new ScannedRouteHookDescriptor(RouteHookKind.Query);
  }

  public static mutation(): MutationHookDescriptor {
    return new ScannedRouteHookDescriptor(RouteHookKind.Mutation);
  }

  public static infiniteQuery(): InfiniteQueryHookDescriptor {
    return new ScannedRouteHookDescriptor(RouteHookKind.InfiniteQuery);
  }

  public static fromKind<K extends RouteHookKind>(kind: K): ScannedRouteHookDescriptor<K> {
    return new ScannedRouteHookDescriptor(kind);
  }
}

// =========================================================================
// CRUD ROLE ADT FLOW DATA & DOMAIN SPECIFICATION (SSOT)
// =========================================================================

export interface BaseCrudRoleDescriptor<R extends CrudRole = CrudRole> {
  readonly role: R;
  readonly isMutating: boolean;
  readonly isCollection: boolean;
  readonly isItem: boolean;
  readonly affectsSingleResource: boolean;
  readonly defaultActionName: string;
  readonly defaultHttpMethod: HttpMethod;
  readonly defaultHookKind: RouteHookKind;
  readonly defaultActionKind: RouteActionKind;
  readonly description: string;
}

export interface IndexCrudRoleDescriptor extends BaseCrudRoleDescriptor<'index'> {
  readonly role: 'index';
  readonly isMutating: false;
  readonly isCollection: true;
  readonly isItem: false;
  readonly affectsSingleResource: false;
  readonly defaultActionName: 'list';
  readonly defaultHttpMethod: typeof HttpMethod.GET;
  readonly defaultHookKind: typeof RouteHookKind.Query;
  readonly defaultActionKind: typeof RouteActionKind.Read;
}

export interface ShowCrudRoleDescriptor extends BaseCrudRoleDescriptor<'show'> {
  readonly role: 'show';
  readonly isMutating: false;
  readonly isCollection: false;
  readonly isItem: true;
  readonly affectsSingleResource: true;
  readonly defaultActionName: 'get';
  readonly defaultHttpMethod: typeof HttpMethod.GET;
  readonly defaultHookKind: typeof RouteHookKind.Query;
  readonly defaultActionKind: typeof RouteActionKind.Read;
}

export interface CreateCrudRoleDescriptor extends BaseCrudRoleDescriptor<'create'> {
  readonly role: 'create';
  readonly isMutating: true;
  readonly isCollection: false;
  readonly isItem: false;
  readonly affectsSingleResource: false;
  readonly defaultActionName: 'create';
  readonly defaultHttpMethod: typeof HttpMethod.POST;
  readonly defaultHookKind: typeof RouteHookKind.Mutation;
  readonly defaultActionKind: typeof RouteActionKind.Create;
}

export interface UpdateCrudRoleDescriptor extends BaseCrudRoleDescriptor<'update'> {
  readonly role: 'update';
  readonly isMutating: true;
  readonly isCollection: false;
  readonly isItem: true;
  readonly affectsSingleResource: true;
  readonly defaultActionName: 'update';
  readonly defaultHttpMethod: typeof HttpMethod.PUT;
  readonly defaultHookKind: typeof RouteHookKind.Mutation;
  readonly defaultActionKind: typeof RouteActionKind.Update;
}

export interface DeleteCrudRoleDescriptor extends BaseCrudRoleDescriptor<'delete'> {
  readonly role: 'delete';
  readonly isMutating: true;
  readonly isCollection: false;
  readonly isItem: true;
  readonly affectsSingleResource: true;
  readonly defaultActionName: 'remove';
  readonly defaultHttpMethod: typeof HttpMethod.DELETE;
  readonly defaultHookKind: typeof RouteHookKind.Mutation;
  readonly defaultActionKind: typeof RouteActionKind.Delete;
}

export interface CustomCrudRoleDescriptor extends BaseCrudRoleDescriptor<'custom'> {
  readonly role: 'custom';
  readonly isMutating: false;
  readonly isCollection: false;
  readonly isItem: false;
  readonly affectsSingleResource: false;
  readonly defaultActionName: 'call';
  readonly defaultHttpMethod: typeof HttpMethod.POST;
  readonly defaultHookKind: typeof RouteHookKind.Mutation;
  readonly defaultActionKind: typeof RouteActionKind.Create;
}

export type AnyCrudRoleDescriptor =
  | IndexCrudRoleDescriptor
  | ShowCrudRoleDescriptor
  | CreateCrudRoleDescriptor
  | UpdateCrudRoleDescriptor
  | DeleteCrudRoleDescriptor
  | CustomCrudRoleDescriptor;

export interface CrudRoleSpecification<R extends CrudRole = CrudRole> extends BaseCrudRoleDescriptor<R> {}

export type CrudRoleRegistry = {
  readonly [K in CrudRole]: CrudRoleSpecification<K>;
};

export const CRUD_ROLE_REGISTRY: CrudRoleRegistry = Object.freeze({
  [CrudRole.Index]: {
    role: CrudRole.Index,
    isMutating: false,
    isCollection: true,
    isItem: false,
    affectsSingleResource: false,
    defaultActionName: 'list',
    defaultHttpMethod: HttpMethod.GET,
    defaultHookKind: RouteHookKind.Query,
    defaultActionKind: RouteActionKind.Read,
    description: 'Collection retrieval of multiple resources'
  },
  [CrudRole.Show]: {
    role: CrudRole.Show,
    isMutating: false,
    isCollection: false,
    isItem: true,
    affectsSingleResource: true,
    defaultActionName: 'get',
    defaultHttpMethod: HttpMethod.GET,
    defaultHookKind: RouteHookKind.Query,
    defaultActionKind: RouteActionKind.Read,
    description: 'Single resource retrieval by identifier'
  },
  [CrudRole.Create]: {
    role: CrudRole.Create,
    isMutating: true,
    isCollection: false,
    isItem: false,
    affectsSingleResource: false,
    defaultActionName: 'create',
    defaultHttpMethod: HttpMethod.POST,
    defaultHookKind: RouteHookKind.Mutation,
    defaultActionKind: RouteActionKind.Create,
    description: 'Creation of a new resource'
  },
  [CrudRole.Update]: {
    role: CrudRole.Update,
    isMutating: true,
    isCollection: false,
    isItem: true,
    affectsSingleResource: true,
    defaultActionName: 'update',
    defaultHttpMethod: HttpMethod.PUT,
    defaultHookKind: RouteHookKind.Mutation,
    defaultActionKind: RouteActionKind.Update,
    description: 'Modification of an existing resource'
  },
  [CrudRole.Delete]: {
    role: CrudRole.Delete,
    isMutating: true,
    isCollection: false,
    isItem: true,
    affectsSingleResource: true,
    defaultActionName: 'remove',
    defaultHttpMethod: HttpMethod.DELETE,
    defaultHookKind: RouteHookKind.Mutation,
    defaultActionKind: RouteActionKind.Delete,
    description: 'Deletion of an existing resource'
  },
  [CrudRole.Custom]: {
    role: CrudRole.Custom,
    isMutating: false,
    isCollection: false,
    isItem: false,
    affectsSingleResource: false,
    defaultActionName: 'call',
    defaultHttpMethod: HttpMethod.POST,
    defaultHookKind: RouteHookKind.Mutation,
    defaultActionKind: RouteActionKind.Create,
    description: 'Custom endpoint outside canonical CRUD operations'
  }
});

export type CrudRoleVisitor<R> = {
  readonly [K in CrudRole]: (spec: CrudRoleSpecification<K>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian CrudRole dengan exhaustive type safety
 */
export function matchCrudRole<R>(
  roleOrRoute: CrudRole | { readonly crudRole: CrudRole } | string,
  visitor: CrudRoleVisitor<R>
): R {
  const rawRole = typeof roleOrRoute === 'string'
    ? roleOrRoute
    : roleOrRoute.crudRole;

  if (!(rawRole in CRUD_ROLE_REGISTRY)) {
    throw new Error(`Unknown CrudRole: ${rawRole}`);
  }

  const role = rawRole as CrudRole;
  switch (role) {
    case CrudRole.Index:
      return visitor.index(CRUD_ROLE_REGISTRY[CrudRole.Index]);
    case CrudRole.Show:
      return visitor.show(CRUD_ROLE_REGISTRY[CrudRole.Show]);
    case CrudRole.Create:
      return visitor.create(CRUD_ROLE_REGISTRY[CrudRole.Create]);
    case CrudRole.Update:
      return visitor.update(CRUD_ROLE_REGISTRY[CrudRole.Update]);
    case CrudRole.Delete:
      return visitor.delete(CRUD_ROLE_REGISTRY[CrudRole.Delete]);
    case CrudRole.Custom:
      return visitor.custom(CRUD_ROLE_REGISTRY[CrudRole.Custom]);
  }
}

export class ScannedCrudRoleDescriptor implements BaseCrudRoleDescriptor {
  public readonly role: CrudRole;
  public readonly isMutating: boolean;
  public readonly isCollection: boolean;
  public readonly isItem: boolean;
  public readonly affectsSingleResource: boolean;
  public readonly defaultActionName: string;
  public readonly defaultHttpMethod: HttpMethod;
  public readonly defaultHookKind: RouteHookKind;
  public readonly defaultActionKind: RouteActionKind;
  public readonly description: string;

  constructor(role: CrudRole = CrudRole.Custom) {
    this.role = role;
    const spec = CRUD_ROLE_REGISTRY[role];
    this.isMutating = spec.isMutating;
    this.isCollection = spec.isCollection;
    this.isItem = spec.isItem;
    this.affectsSingleResource = spec.affectsSingleResource;
    this.defaultActionName = spec.defaultActionName;
    this.defaultHttpMethod = spec.defaultHttpMethod;
    this.defaultHookKind = spec.defaultHookKind;
    this.defaultActionKind = spec.defaultActionKind;
    this.description = spec.description;
    Object.freeze(this);
  }

  public static index(): IndexCrudRoleDescriptor {
    return new ScannedCrudRoleDescriptor(CrudRole.Index) as unknown as IndexCrudRoleDescriptor;
  }

  public static show(): ShowCrudRoleDescriptor {
    return new ScannedCrudRoleDescriptor(CrudRole.Show) as unknown as ShowCrudRoleDescriptor;
  }

  public static create(): CreateCrudRoleDescriptor {
    return new ScannedCrudRoleDescriptor(CrudRole.Create) as unknown as CreateCrudRoleDescriptor;
  }

  public static update(): UpdateCrudRoleDescriptor {
    return new ScannedCrudRoleDescriptor(CrudRole.Update) as unknown as UpdateCrudRoleDescriptor;
  }

  public static delete(): DeleteCrudRoleDescriptor {
    return new ScannedCrudRoleDescriptor(CrudRole.Delete) as unknown as DeleteCrudRoleDescriptor;
  }

  public static custom(): CustomCrudRoleDescriptor {
    return new ScannedCrudRoleDescriptor(CrudRole.Custom) as unknown as CustomCrudRoleDescriptor;
  }

  public static fromRole(role: CrudRole): ScannedCrudRoleDescriptor {
    return new ScannedCrudRoleDescriptor(role);
  }
}



export const SdkResponseKind = Object.freeze({
  Void: 'void',
  Raw: 'raw',
  Validated: 'validated',
  Mapped: 'mapped',
  ValidatedAndMapped: 'validated_and_mapped'
} as const);
export type SdkResponseKind = typeof SdkResponseKind[keyof typeof SdkResponseKind];
