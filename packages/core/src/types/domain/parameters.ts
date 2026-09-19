import type {
  RouteParameterLocation as RouteParameterLocationType,
  RouteParameterType as RouteParameterTypeValue,
  RouteParameterBinding,
  RouteParameter as UpstreamRouteParameter
} from '../upstream/route';

export type RouteParameterLocation = RouteParameterLocationType;
export type RouteParameterType = RouteParameterTypeValue;
export type { RouteParameterBinding };
export type { RouteParameterConstraint } from '../upstream/route';

export const RouteParameterLocation = Object.freeze({
  Path: 'path' as const,
  Query: 'query' as const,
  Header: 'header' as const
});

export const RouteParameterType = Object.freeze({
  String: 'string' as const,
  Number: 'number' as const,
  Boolean: 'boolean' as const,
  Uuid: 'uuid' as const,
  Ulid: 'ulid' as const,
  Date: 'date' as const,
  Slug: 'slug' as const
});

export interface RouteParameterTypeSpecification<T extends RouteParameterType = RouteParameterType> {
  readonly type: T;
  readonly tsType: 'number' | 'string' | 'boolean';
  readonly isNumeric: boolean;
  readonly isStringLike: boolean;
  readonly isIdentifier: boolean;
  readonly pattern: string;
  readonly zodValidator: string;
  readonly description: string;
}

export type RouteParameterTypeRegistry = {
  readonly [K in RouteParameterType]: RouteParameterTypeSpecification<K>;
};

export const ROUTE_PARAMETER_TYPE_REGISTRY: RouteParameterTypeRegistry = Object.freeze({
  [RouteParameterType.Number]: {
    type: RouteParameterType.Number,
    tsType: 'number',
    isNumeric: true,
    isStringLike: false,
    isIdentifier: true,
    pattern: '^\\d+$',
    zodValidator: 'z.coerce.number()',
    description: 'Numeric path or query parameter'
  },
  [RouteParameterType.String]: {
    type: RouteParameterType.String,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    isIdentifier: false,
    pattern: '.*',
    zodValidator: 'z.string()',
    description: 'Generic string parameter'
  },
  [RouteParameterType.Boolean]: {
    type: RouteParameterType.Boolean,
    tsType: 'boolean',
    isNumeric: false,
    isStringLike: false,
    isIdentifier: false,
    pattern: '^(true|false|1|0)$',
    zodValidator: 'z.coerce.boolean()',
    description: 'Boolean flag parameter'
  },
  [RouteParameterType.Uuid]: {
    type: RouteParameterType.Uuid,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    isIdentifier: true,
    pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    zodValidator: 'z.string().uuid()',
    description: 'RFC 4122 Universally Unique Identifier'
  },
  [RouteParameterType.Ulid]: {
    type: RouteParameterType.Ulid,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    isIdentifier: true,
    pattern: '^[0-7][0-9A-HJKMNP-TV-Z]{25}$',
    zodValidator: 'z.string().ulid()',
    description: 'Universally Unique Lexicographically Sortable Identifier'
  },
  [RouteParameterType.Date]: {
    type: RouteParameterType.Date,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    isIdentifier: false,
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    zodValidator: 'z.string().date()',
    description: 'ISO-8601 date parameter'
  },
  [RouteParameterType.Slug]: {
    type: RouteParameterType.Slug,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    isIdentifier: true,
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    zodValidator: 'z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)',
    description: 'URL-friendly slug identifier'
  }
});

export type RouteParameterTypeVisitor<R> = {
  readonly number: (spec: RouteParameterTypeSpecification<'number'>) => R;
  readonly string: (spec: RouteParameterTypeSpecification<'string'>) => R;
  readonly boolean: (spec: RouteParameterTypeSpecification<'boolean'>) => R;
  readonly uuid: (spec: RouteParameterTypeSpecification<'uuid'>) => R;
  readonly ulid: (spec: RouteParameterTypeSpecification<'ulid'>) => R;
  readonly date: (spec: RouteParameterTypeSpecification<'date'>) => R;
  readonly slug: (spec: RouteParameterTypeSpecification<'slug'>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik RouteParameterType dengan exhaustive type safety
 */
export function matchRouteParameterType<R>(
  typeOrParam: RouteParameterType | { readonly type: RouteParameterType },
  visitor: RouteParameterTypeVisitor<R>
): R {
  const type = typeof typeOrParam === 'string' ? typeOrParam : typeOrParam.type;
  const spec = ROUTE_PARAMETER_TYPE_REGISTRY[type];
  return visitor[type](spec as any);
}


export type RouteBindingField = RouteParameterBinding;
export type RouteParameter = UpstreamRouteParameter;
export type PathParameterDescriptor = Extract<RouteParameter, { readonly location: 'path' }>;
export type QueryParameterDescriptor = Extract<RouteParameter, { readonly location: 'query' }>;
export type HeaderParameterDescriptor = Extract<RouteParameter, { readonly location: 'header' }>;
export type AnyRouteParameter = PathParameterDescriptor | QueryParameterDescriptor | HeaderParameterDescriptor;

export interface RouteParameterLocationSpecification<K extends RouteParameterLocation = RouteParameterLocation> {
  readonly location: K;
  readonly defaultRequired: boolean;
  readonly isUrlSegment: boolean;
  readonly isTransportHeader: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key RouteParameterLocation.
 */
export type RouteParameterLocationRegistry = {
  readonly [K in RouteParameterLocation]: RouteParameterLocationSpecification<K>;
};

export const PARAMETER_LOCATION_REGISTRY: RouteParameterLocationRegistry = Object.freeze({
  [RouteParameterLocation.Path]: {
    location: RouteParameterLocation.Path,
    defaultRequired: true,
    isUrlSegment: true,
    isTransportHeader: false,
  },
  [RouteParameterLocation.Query]: {
    location: RouteParameterLocation.Query,
    defaultRequired: false,
    isUrlSegment: true,
    isTransportHeader: false,
  },
  [RouteParameterLocation.Header]: {
    location: RouteParameterLocation.Header,
    defaultRequired: true,
    isUrlSegment: false,
    isTransportHeader: true,
  },
});

export interface RouteParameterVisitor<R> {
  readonly path: (param: PathParameterDescriptor) => R;
  readonly query: (param: QueryParameterDescriptor) => R;
  readonly header: (param: HeaderParameterDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik lokasi parameter dengan exhaustive type safety
 */
export function matchRouteParameter<R>(
  param: RouteParameter,
  visitor: RouteParameterVisitor<R>
): R {
  if (param.location === 'path') return visitor.path(param);
  if (param.location === 'query') return visitor.query(param);
  return visitor.header(param);
}

