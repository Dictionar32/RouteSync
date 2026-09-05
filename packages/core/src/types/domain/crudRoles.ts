import { HttpMethod, RouteActionKind } from "./security";

/**
 * CrudRole
 *
 * Canonical REST CRUD Role Vocabulary.
 */
export const CrudRole = Object.freeze({
  Index: 'index',
  Show: 'show',
  Create: 'create',
  Update: 'update',
  Delete: 'delete',
  Custom: 'custom'
} as const);

export type CrudRole = typeof CrudRole[keyof typeof CrudRole];


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
  readonly path: string;
  readonly query: readonly string[];
  readonly params: readonly string[];
}

export interface PageEndpointVisitor<R> {
  readonly static: (endpoint: PageEndpointDescriptor) => R;
  readonly parameterized: (endpoint: PageEndpointDescriptor) => R;
  readonly query_filtered: (endpoint: PageEndpointDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian PageEndpointDescriptor dengan exhaustive type safety
 */
export function matchPageEndpoint<R>(
  endpoint: PageEndpointDescriptor | PageEndpointKind,
  visitor: PageEndpointVisitor<R>
): R {
  const isKindString = typeof endpoint === 'string';
  const kind = isKindString ? endpoint : endpoint.kind;
  const descriptor: PageEndpointDescriptor = isKindString
    ? {
        kind,
        path: '/',
        query: kind === PageEndpointKind.QueryFiltered ? ['filter'] : [],
        params: kind === PageEndpointKind.Parameterized ? ['id'] : []
      }
    : endpoint;
  return visitor[kind](descriptor);
}


// =========================================================================
// EXPLICIT COMPILER ENUMS & DOMAIN MODELS (SSOT ORIGIN BOUNDARY)
// =========================================================================

export const RouteHookKind = Object.freeze({
  Query: 'query',
  Mutation: 'mutation',
  InfiniteQuery: 'infinite_query'
} as const);
export type RouteHookKind = typeof RouteHookKind[keyof typeof RouteHookKind];

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
  K extends 'query' ? QueryHookDescriptor :
  K extends 'mutation' ? MutationHookDescriptor :
  K extends 'infinite_query' ? InfiniteQueryHookDescriptor :
  BaseRouteHookDescriptor<K>;

export interface HookKindSpecification<K extends RouteHookKind = RouteHookKind> {
  readonly kind: K;
  readonly hookPrefix: string;
  readonly tanstackHookName: string;
  readonly isMutating: boolean;
  readonly requiresQueryKey: boolean;
  readonly supportsPagination: boolean;
  readonly defaultOptionsTypeName: string;
}

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
  const spec = HOOK_KIND_REGISTRY[kind] ?? HOOK_KIND_REGISTRY[RouteHookKind.Query];
  return visitor[kind](spec as any);
}

export const matchHookKind = matchRouteHookKind;

export class ScannedRouteHookDescriptor implements BaseRouteHookDescriptor {
  public readonly kind: RouteHookKind;
  public readonly hookPrefix: string;
  public readonly tanstackHookName: string;
  public readonly isMutating: boolean;
  public readonly requiresQueryKey: boolean;
  public readonly supportsPagination: boolean;

  constructor(kind: RouteHookKind = RouteHookKind.Query) {
    this.kind = kind;
    const spec = HOOK_KIND_REGISTRY[kind] ?? HOOK_KIND_REGISTRY[RouteHookKind.Query];
    this.hookPrefix = spec.hookPrefix;
    this.tanstackHookName = spec.tanstackHookName;
    this.isMutating = spec.isMutating;
    this.requiresQueryKey = spec.requiresQueryKey;
    this.supportsPagination = spec.supportsPagination;
    Object.freeze(this);
  }

  public static query(): QueryHookDescriptor {
    return new ScannedRouteHookDescriptor(RouteHookKind.Query) as unknown as QueryHookDescriptor;
  }

  public static mutation(): MutationHookDescriptor {
    return new ScannedRouteHookDescriptor(RouteHookKind.Mutation) as unknown as MutationHookDescriptor;
  }

  public static infiniteQuery(): InfiniteQueryHookDescriptor {
    return new ScannedRouteHookDescriptor(RouteHookKind.InfiniteQuery) as unknown as InfiniteQueryHookDescriptor;
  }

  public static fromKind(kind: RouteHookKind): ScannedRouteHookDescriptor {
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
    : (roleOrRoute as any).crudRole;
  const spec = (CRUD_ROLE_REGISTRY as Record<string, CrudRoleSpecification>)[rawRole] ?? CRUD_ROLE_REGISTRY[CrudRole.Custom];
  return visitor[spec.role](spec as any);
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
    const spec = (CRUD_ROLE_REGISTRY as Record<string, CrudRoleSpecification>)[role] ?? CRUD_ROLE_REGISTRY[CrudRole.Custom];
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
