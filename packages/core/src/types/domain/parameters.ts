import type { ValidationRuleKind } from "./validation";

export const RouteParameterLocation = Object.freeze({
  Path: 'path',
  Query: 'query',
  Header: 'header'
} as const);

export type RouteParameterLocation = typeof RouteParameterLocation[keyof typeof RouteParameterLocation];

/**
 * RouteParameterType
 *
 * Canonical Domain Vocabulary for HTTP Route Parameter Data Types.
 */
export const RouteParameterType = Object.freeze({
  String: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Uuid: 'uuid',
  Ulid: 'ulid',
  Date: 'date',
  Slug: 'slug'
} as const);

export type RouteParameterType = typeof RouteParameterType[keyof typeof RouteParameterType];

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


export type RouteBindingField =
  | { readonly kind: 'convention' }
  | { readonly kind: 'explicit'; readonly value: string };

export interface RouteParameter {
  readonly name: string;
  readonly propertyName: string; // Canonical TS Identifier
  readonly bindingField: RouteBindingField; // Canonical Laravel binding state
  readonly in: RouteParameterLocation;
  readonly required: boolean;
  readonly type: RouteParameterType; // ✅ 100% Guaranteed Canonical Vocabulary
}

export interface PathParameterDescriptor extends RouteParameter {
  readonly in: 'path';
}

export interface QueryParameterDescriptor extends RouteParameter {
  readonly in: 'query';
}

export interface HeaderParameterDescriptor extends RouteParameter {
  readonly in: 'header';
}

export type AnyRouteParameter =
  | PathParameterDescriptor
  | QueryParameterDescriptor
  | HeaderParameterDescriptor;

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
  return visitor[param.in](param as any);
}

