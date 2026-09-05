import type { CrudRole } from "./lifecycle";
import type { RouteParameterType } from "./parameters";

/**
 * Canonical Domain Vocabulary for HTTP Methods.
 */
export const HttpMethod = Object.freeze({
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD'
} as const);

export type HttpMethod = typeof HttpMethod[keyof typeof HttpMethod];

/**
 * Canonical Domain Vocabulary for Route Action Kinds.
 */
export const RouteActionKind = Object.freeze({
  Create: 'create',
  Update: 'update',
  Read: 'read',
  Delete: 'delete'
} as const);

export type RouteActionKind = typeof RouteActionKind[keyof typeof RouteActionKind];

export interface HttpMethodSpecification<M extends HttpMethod = HttpMethod> {
  readonly method: M;
  readonly actionKind: RouteActionKind;
  readonly isMutating: boolean;
  readonly isSafe: boolean;
  readonly isIdempotent: boolean;
  readonly hasBody: boolean;
  readonly defaultCrudRole: CrudRole;
  readonly description: string;
}

export type HttpMethodRegistry = {
  readonly [K in HttpMethod]: HttpMethodSpecification<K>;
};

export const HTTP_METHOD_REGISTRY: HttpMethodRegistry = Object.freeze({
  [HttpMethod.GET]: {
    method: HttpMethod.GET,
    actionKind: RouteActionKind.Read,
    isMutating: false,
    isSafe: true,
    isIdempotent: true,
    hasBody: false,
    defaultCrudRole: 'show',
    description: 'Safe, idempotent retrieval of resources'
  },
  [HttpMethod.POST]: {
    method: HttpMethod.POST,
    actionKind: RouteActionKind.Create,
    isMutating: true,
    isSafe: false,
    isIdempotent: false,
    hasBody: true,
    defaultCrudRole: 'create',
    description: 'Non-idempotent resource creation or action execution'
  },
  [HttpMethod.PUT]: {
    method: HttpMethod.PUT,
    actionKind: RouteActionKind.Update,
    isMutating: true,
    isSafe: false,
    isIdempotent: true,
    hasBody: true,
    defaultCrudRole: 'update',
    description: 'Idempotent complete replacement/update of a resource'
  },
  [HttpMethod.PATCH]: {
    method: HttpMethod.PATCH,
    actionKind: RouteActionKind.Update,
    isMutating: true,
    isSafe: false,
    isIdempotent: false,
    hasBody: true,
    defaultCrudRole: 'update',
    description: 'Partial modification/update of a resource'
  },
  [HttpMethod.DELETE]: {
    method: HttpMethod.DELETE,
    actionKind: RouteActionKind.Delete,
    isMutating: true,
    isSafe: false,
    isIdempotent: true,
    hasBody: false,
    defaultCrudRole: 'delete',
    description: 'Idempotent removal of a resource'
  },
  [HttpMethod.OPTIONS]: {
    method: HttpMethod.OPTIONS,
    actionKind: RouteActionKind.Read,
    isMutating: false,
    isSafe: true,
    isIdempotent: true,
    hasBody: false,
    defaultCrudRole: 'show',
    description: 'Describes the communication options for the target resource'
  },
  [HttpMethod.HEAD]: {
    method: HttpMethod.HEAD,
    actionKind: RouteActionKind.Read,
    isMutating: false,
    isSafe: true,
    isIdempotent: true,
    hasBody: false,
    defaultCrudRole: 'show',
    description: 'Same as GET but returns headers only without response body'
  }
});

export type HttpMethodVisitor<R> = {
  readonly GET: (spec: HttpMethodSpecification<'GET'>) => R;
  readonly POST: (spec: HttpMethodSpecification<'POST'>) => R;
  readonly PUT: (spec: HttpMethodSpecification<'PUT'>) => R;
  readonly PATCH: (spec: HttpMethodSpecification<'PATCH'>) => R;
  readonly DELETE: (spec: HttpMethodSpecification<'DELETE'>) => R;
  readonly OPTIONS: (spec: HttpMethodSpecification<'OPTIONS'>) => R;
  readonly HEAD: (spec: HttpMethodSpecification<'HEAD'>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik HttpMethod dengan exhaustive type safety
 */
export function matchHttpMethod<R>(
  methodOrRoute: HttpMethod | { readonly method: HttpMethod } | string,
  visitor: HttpMethodVisitor<R>
): R {
  const raw = typeof methodOrRoute === 'string' ? methodOrRoute : methodOrRoute.method;
  const upper = raw.toUpperCase() as HttpMethod;
  const spec = HTTP_METHOD_REGISTRY[upper] ?? HTTP_METHOD_REGISTRY.GET;
  return visitor[spec.method](spec as any);
}

export interface RouteActionKindSpecification<A extends RouteActionKind = RouteActionKind> {
  readonly actionKind: A;
  readonly isMutating: boolean;
  readonly defaultMethod: HttpMethod;
  readonly defaultCrudRole: CrudRole;
  readonly description: string;
}

export type RouteActionKindRegistry = {
  readonly [K in RouteActionKind]: RouteActionKindSpecification<K>;
};

export const ROUTE_ACTION_KIND_REGISTRY: RouteActionKindRegistry = Object.freeze({
  [RouteActionKind.Create]: {
    actionKind: RouteActionKind.Create,
    isMutating: true,
    defaultMethod: HttpMethod.POST,
    defaultCrudRole: 'create',
    description: 'Creation of a new entity or resource'
  },
  [RouteActionKind.Update]: {
    actionKind: RouteActionKind.Update,
    isMutating: true,
    defaultMethod: HttpMethod.PUT,
    defaultCrudRole: 'update',
    description: 'Modification or mutation of an existing entity'
  },
  [RouteActionKind.Read]: {
    actionKind: RouteActionKind.Read,
    isMutating: false,
    defaultMethod: HttpMethod.GET,
    defaultCrudRole: 'show',
    description: 'Retrieval or query of an entity or collection'
  },
  [RouteActionKind.Delete]: {
    actionKind: RouteActionKind.Delete,
    isMutating: true,
    defaultMethod: HttpMethod.DELETE,
    defaultCrudRole: 'delete',
    description: 'Deletion or destruction of an entity'
  }
});

export type RouteActionKindVisitor<R> = {
  readonly create: (spec: RouteActionKindSpecification<'create'>) => R;
  readonly update: (spec: RouteActionKindSpecification<'update'>) => R;
  readonly read: (spec: RouteActionKindSpecification<'read'>) => R;
  readonly delete: (spec: RouteActionKindSpecification<'delete'>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik RouteActionKind dengan exhaustive type safety
 */
export function matchRouteActionKind<R>(
  kindOrAction: RouteActionKind | { readonly actionKind: RouteActionKind },
  visitor: RouteActionKindVisitor<R>
): R {
  const kind = typeof kindOrAction === 'string' ? kindOrAction : kindOrAction.actionKind;
  const spec = ROUTE_ACTION_KIND_REGISTRY[kind];
  return visitor[kind](spec as any);
}


/**
 * Canonical Domain Vocabulary for Route Authentication Schemes.
 */
export const SecuritySchemeKind = Object.freeze({
  Sanctum: 'sanctum',
  Bearer: 'bearer',
  Cookie: 'cookie',
  Public: 'public'
} as const);

export type SecuritySchemeKind = typeof SecuritySchemeKind[keyof typeof SecuritySchemeKind];

/**
 * First-Class Route Security & Authentication Descriptor (Guaranteed Complete Model).
 * Eliminates downstream middleware.some(m => m.startsWith('auth')).
 */
export interface RouteSecurityDescriptor {
  readonly isProtected: boolean;
  readonly scheme: SecuritySchemeKind;
  readonly guards: readonly string[];
  readonly abilities: readonly string[]; // ✅ Dedicated Sanctum/Passport Abilities SSOT
}

export interface ScannedRouteSecurityParams {
  readonly isProtected: boolean;
  readonly scheme: SecuritySchemeKind;
  readonly guards: readonly string[];
  readonly abilities: readonly string[];
}

/**
 * Reusable Constructor: Scanned Route Security Descriptor.
 */
export class ScannedRouteSecurityDescriptor implements RouteSecurityDescriptor {
  public readonly isProtected: boolean;
  public readonly scheme: SecuritySchemeKind;
  public readonly guards: readonly string[];
  public readonly abilities: readonly string[];

  constructor(params: ScannedRouteSecurityParams) {
    this.isProtected = params.isProtected;
    this.scheme = params.scheme;
    this.guards = Object.freeze([...params.guards]);
    this.abilities = Object.freeze([...params.abilities]);
    Object.freeze(this);
  }

  public static create({
    isProtected = false,
    scheme = SecuritySchemeKind.Public,
    guards = [],
    abilities = []
  }: {
    readonly isProtected?: boolean;
    readonly scheme?: SecuritySchemeKind;
    readonly guards?: readonly string[];
    readonly abilities?: readonly string[];
  } = {}): ScannedRouteSecurityDescriptor {
    return new ScannedRouteSecurityDescriptor({
      isProtected,
      scheme,
      guards,
      abilities
    });
  }

  public static public(): ScannedRouteSecurityDescriptor {
    return new ScannedRouteSecurityDescriptor({
      isProtected: false,
      scheme: SecuritySchemeKind.Public,
      guards: [],
      abilities: []
    });
  }

  public static protected(
    scheme: SecuritySchemeKind = SecuritySchemeKind.Bearer,
    guards: readonly string[] = [],
    abilities: readonly string[] = []
  ): ScannedRouteSecurityDescriptor {
    return new ScannedRouteSecurityDescriptor({
      isProtected: true,
      scheme,
      guards,
      abilities
    });
  }
}

export class RouteSecurityClassifier {
  public static classify(middleware: readonly string[]): RouteSecurityDescriptor {
    const guards: string[] = [];
    const abilities: string[] = [];
    let isProtected = false;
    let scheme: SecuritySchemeKind = SecuritySchemeKind.Public;

    for (const m of middleware) {
      const trimmed = m.trim();
      const lower = trimmed.toLowerCase();
      if (lower === 'auth:sanctum') {
        isProtected = true;
        scheme = SecuritySchemeKind.Sanctum;
        guards.push('sanctum');
      } else if (lower === 'auth:api' || lower === 'auth:bearer') {
        isProtected = true;
        scheme = SecuritySchemeKind.Bearer;
        guards.push('api');
      } else if (lower === 'auth' || lower.startsWith('auth:')) {
        isProtected = true;
        scheme = SecuritySchemeKind.Cookie;
        guards.push('web');
      } else if (lower.startsWith('ability:') || lower.startsWith('abilities:')) {
        const colonIdx = trimmed.indexOf(':');
        const items = trimmed.slice(colonIdx + 1).split(',').map(s => s.trim()).filter(Boolean);
        abilities.push(...items);
      }
    }

    return new ScannedRouteSecurityDescriptor({
      isProtected,
      scheme,
      guards,
      abilities
    });
  }
}

export interface SecuritySchemeSpecification<K extends SecuritySchemeKind = SecuritySchemeKind> {
  readonly scheme: K;
  readonly isProtected: boolean;
  readonly requiresAuthorizationHeader: boolean;
  readonly defaultHeaderName: string | null;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key SecuritySchemeKind.
 */
export type SecuritySchemeRegistry = {
  readonly [K in SecuritySchemeKind]: SecuritySchemeSpecification<K>;
};

export const SECURITY_SCHEME_REGISTRY: SecuritySchemeRegistry = Object.freeze({
  [SecuritySchemeKind.Sanctum]: {
    scheme: SecuritySchemeKind.Sanctum,
    isProtected: true,
    requiresAuthorizationHeader: true,
    defaultHeaderName: 'Authorization',
  },
  [SecuritySchemeKind.Bearer]: {
    scheme: SecuritySchemeKind.Bearer,
    isProtected: true,
    requiresAuthorizationHeader: true,
    defaultHeaderName: 'Authorization',
  },
  [SecuritySchemeKind.Cookie]: {
    scheme: SecuritySchemeKind.Cookie,
    isProtected: true,
    requiresAuthorizationHeader: false,
    defaultHeaderName: null,
  },
  [SecuritySchemeKind.Public]: {
    scheme: SecuritySchemeKind.Public,
    isProtected: false,
    requiresAuthorizationHeader: false,
    defaultHeaderName: null,
  },
});

export interface RouteSecurityVisitor<R> {
  readonly sanctum: (security: RouteSecurityDescriptor) => R;
  readonly bearer: (security: RouteSecurityDescriptor) => R;
  readonly cookie: (security: RouteSecurityDescriptor) => R;
  readonly public: (security: RouteSecurityDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik skema keamanan RouteSecurityDescriptor dengan exhaustive type safety
 */
export function matchRouteSecurity<R>(
  security: RouteSecurityDescriptor,
  visitor: RouteSecurityVisitor<R>
): R {
  return visitor[security.scheme](security);
}

/**
 * HttpStatusCode
 *
 * Canonical Domain Vocabulary for Standard HTTP Status Codes.
 */
export const HttpStatusCode = Object.freeze({
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NoContent: 204,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  Conflict: 409,
  UnprocessableEntity: 422,
  TooManyRequests: 429,
  InternalServerError: 500
} as const);

export type HttpStatusCode = typeof HttpStatusCode[keyof typeof HttpStatusCode] | number;

export type KnownHttpStatusCode = typeof HttpStatusCode[keyof typeof HttpStatusCode];

export type HttpStatusCodeCategory = 'informational' | 'success' | 'redirection' | 'client_error' | 'server_error';

export interface HttpStatusCodeSpecification<C extends number = number> {
  readonly code: C;
  readonly name: string;
  readonly category: HttpStatusCodeCategory;
  readonly isSuccess: boolean;
  readonly isError: boolean;
  readonly isClientError: boolean;
  readonly isServerError: boolean;
  readonly hasResponseBody: boolean;
  readonly statusText: string;
  readonly description: string;
}

export type HttpStatusCodeRegistry = {
  readonly [K in KnownHttpStatusCode]: HttpStatusCodeSpecification<K>;
};

export const HTTP_STATUS_CODE_REGISTRY: HttpStatusCodeRegistry = Object.freeze({
  [HttpStatusCode.Ok]: {
    code: HttpStatusCode.Ok,
    name: 'Ok',
    category: 'success',
    isSuccess: true,
    isError: false,
    isClientError: false,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'OK',
    description: 'Standard successful HTTP response'
  },
  [HttpStatusCode.Created]: {
    code: HttpStatusCode.Created,
    name: 'Created',
    category: 'success',
    isSuccess: true,
    isError: false,
    isClientError: false,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Created',
    description: 'Resource successfully created'
  },
  [HttpStatusCode.Accepted]: {
    code: HttpStatusCode.Accepted,
    name: 'Accepted',
    category: 'success',
    isSuccess: true,
    isError: false,
    isClientError: false,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Accepted',
    description: 'Request accepted for processing but processing has not completed'
  },
  [HttpStatusCode.NoContent]: {
    code: HttpStatusCode.NoContent,
    name: 'NoContent',
    category: 'success',
    isSuccess: true,
    isError: false,
    isClientError: false,
    isServerError: false,
    hasResponseBody: false,
    statusText: 'No Content',
    description: 'Request successfully processed, no payload content returned'
  },
  [HttpStatusCode.BadRequest]: {
    code: HttpStatusCode.BadRequest,
    name: 'BadRequest',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Bad Request',
    description: 'Server could not understand the request due to invalid syntax'
  },
  [HttpStatusCode.Unauthorized]: {
    code: HttpStatusCode.Unauthorized,
    name: 'Unauthorized',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Unauthorized',
    description: 'Authentication is required and has failed or has not been provided'
  },
  [HttpStatusCode.Forbidden]: {
    code: HttpStatusCode.Forbidden,
    name: 'Forbidden',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Forbidden',
    description: 'Client does not have access rights to the content'
  },
  [HttpStatusCode.NotFound]: {
    code: HttpStatusCode.NotFound,
    name: 'NotFound',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Not Found',
    description: 'Server cannot find the requested resource'
  },
  [HttpStatusCode.MethodNotAllowed]: {
    code: HttpStatusCode.MethodNotAllowed,
    name: 'MethodNotAllowed',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Method Not Allowed',
    description: 'Request HTTP method is not supported for the target resource'
  },
  [HttpStatusCode.Conflict]: {
    code: HttpStatusCode.Conflict,
    name: 'Conflict',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Conflict',
    description: 'Request conflicts with the current state of the server'
  },
  [HttpStatusCode.UnprocessableEntity]: {
    code: HttpStatusCode.UnprocessableEntity,
    name: 'UnprocessableEntity',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Unprocessable Entity',
    description: 'Request was well-formed but was unable to be followed due to semantic errors (Laravel validation failure)'
  },
  [HttpStatusCode.TooManyRequests]: {
    code: HttpStatusCode.TooManyRequests,
    name: 'TooManyRequests',
    category: 'client_error',
    isSuccess: false,
    isError: true,
    isClientError: true,
    isServerError: false,
    hasResponseBody: true,
    statusText: 'Too Many Requests',
    description: 'User has sent too many requests in a given amount of time (rate limited)'
  },
  [HttpStatusCode.InternalServerError]: {
    code: HttpStatusCode.InternalServerError,
    name: 'InternalServerError',
    category: 'server_error',
    isSuccess: false,
    isError: true,
    isClientError: false,
    isServerError: true,
    hasResponseBody: true,
    statusText: 'Internal Server Error',
    description: 'Server encountered an unexpected condition that prevented it from fulfilling the request'
  }
});

export type HttpStatusCodeVisitor<R> = {
  readonly 200: (spec: HttpStatusCodeSpecification<200>) => R;
  readonly 201: (spec: HttpStatusCodeSpecification<201>) => R;
  readonly 202: (spec: HttpStatusCodeSpecification<202>) => R;
  readonly 204: (spec: HttpStatusCodeSpecification<204>) => R;
  readonly 400: (spec: HttpStatusCodeSpecification<400>) => R;
  readonly 401: (spec: HttpStatusCodeSpecification<401>) => R;
  readonly 403: (spec: HttpStatusCodeSpecification<403>) => R;
  readonly 404: (spec: HttpStatusCodeSpecification<404>) => R;
  readonly 405: (spec: HttpStatusCodeSpecification<405>) => R;
  readonly 409: (spec: HttpStatusCodeSpecification<409>) => R;
  readonly 422: (spec: HttpStatusCodeSpecification<422>) => R;
  readonly 429: (spec: HttpStatusCodeSpecification<429>) => R;
  readonly 500: (spec: HttpStatusCodeSpecification<500>) => R;
  readonly other?: (code: number) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik HttpStatusCode dengan exhaustive type safety
 */
export function matchHttpStatusCode<R>(
  codeOrObject: number | { readonly status: number } | { readonly statusCode: number },
  visitor: HttpStatusCodeVisitor<R>
): R {
  const code: number = typeof codeOrObject === 'number'
    ? codeOrObject
    : 'status' in codeOrObject
      ? codeOrObject.status
      : (codeOrObject as any).statusCode;

  const handler = (visitor as any)[code];
  if (handler) {
    const spec = (HTTP_STATUS_CODE_REGISTRY as any)[code];
    return handler(spec);
  }
  if (visitor.other) {
    return visitor.other(code);
  }
  throw new Error(`Unhandled HttpStatusCode: ${code}`);
}


/**
 * RateLimitDescriptor
 *
 * Explicit Domain Model for Laravel Route Rate Limiting (throttle middleware).
 */
export interface RateLimitDescriptor {
  readonly maxAttempts: number;
  readonly decayMinutes: number;
}

/**
 * RequestContentType
 *
 * Canonical Domain Vocabulary for HTTP Request Payloads.
 */
export const RequestContentType = Object.freeze({
  Json: 'application/json',
  Multipart: 'multipart/form-data',
  UrlEncoded: 'application/x-www-form-urlencoded',
  None: 'none'
} as const);

export type RequestContentType = typeof RequestContentType[keyof typeof RequestContentType];

export interface BaseRequestContentTypeDescriptor {
  readonly kind: RequestContentType;
  readonly mimeType: string | null;
  readonly isBinary: boolean;
  readonly hasPayload: boolean;
}

export interface JsonRequestContentTypeDescriptor extends BaseRequestContentTypeDescriptor {
  readonly kind: 'application/json';
  readonly mimeType: 'application/json';
  readonly isBinary: false;
  readonly hasPayload: true;
}

export interface MultipartRequestContentTypeDescriptor extends BaseRequestContentTypeDescriptor {
  readonly kind: 'multipart/form-data';
  readonly mimeType: 'multipart/form-data';
  readonly isBinary: true;
  readonly hasPayload: true;
}

export interface UrlEncodedRequestContentTypeDescriptor extends BaseRequestContentTypeDescriptor {
  readonly kind: 'application/x-www-form-urlencoded';
  readonly mimeType: 'application/x-www-form-urlencoded';
  readonly isBinary: false;
  readonly hasPayload: true;
}

export interface NoneRequestContentTypeDescriptor extends BaseRequestContentTypeDescriptor {
  readonly kind: 'none';
  readonly mimeType: null;
  readonly isBinary: false;
  readonly hasPayload: false;
}

export type RequestContentTypeDescriptor =
  | JsonRequestContentTypeDescriptor
  | MultipartRequestContentTypeDescriptor
  | UrlEncodedRequestContentTypeDescriptor
  | NoneRequestContentTypeDescriptor;

export interface RequestContentTypeSpecification<K extends RequestContentType = RequestContentType> {
  readonly kind: K;
  readonly mimeType: string | null;
  readonly isBinary: boolean;
  readonly hasPayload: boolean;
  readonly headerExpression: string | null;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key RequestContentType.
 */
export type RequestContentTypeRegistry = {
  readonly [K in RequestContentType]: RequestContentTypeSpecification<K>;
};

export const REQUEST_CONTENT_TYPE_REGISTRY: RequestContentTypeRegistry = Object.freeze({
  [RequestContentType.Json]: {
    kind: RequestContentType.Json,
    mimeType: 'application/json',
    isBinary: false,
    hasPayload: true,
    headerExpression: "'Content-Type': 'application/json'"
  },
  [RequestContentType.Multipart]: {
    kind: RequestContentType.Multipart,
    mimeType: 'multipart/form-data',
    isBinary: true,
    hasPayload: true,
    headerExpression: "'Content-Type': 'multipart/form-data'"
  },
  [RequestContentType.UrlEncoded]: {
    kind: RequestContentType.UrlEncoded,
    mimeType: 'application/x-www-form-urlencoded',
    isBinary: false,
    hasPayload: true,
    headerExpression: "'Content-Type': 'application/x-www-form-urlencoded'"
  },
  [RequestContentType.None]: {
    kind: RequestContentType.None,
    mimeType: null,
    isBinary: false,
    hasPayload: false,
    headerExpression: null
  }
});

export class ScannedRequestContentTypeDescriptor implements BaseRequestContentTypeDescriptor {
  public readonly kind: RequestContentType;
  public readonly mimeType: string | null;
  public readonly isBinary: boolean;
  public readonly hasPayload: boolean;

  constructor(spec: RequestContentTypeSpecification) {
    this.kind = spec.kind;
    this.mimeType = spec.mimeType;
    this.isBinary = spec.isBinary;
    this.hasPayload = spec.hasPayload;
    Object.freeze(this);
  }

  public static json(): JsonRequestContentTypeDescriptor {
    return new ScannedRequestContentTypeDescriptor(
      REQUEST_CONTENT_TYPE_REGISTRY[RequestContentType.Json]
    ) as JsonRequestContentTypeDescriptor;
  }

  public static multipart(): MultipartRequestContentTypeDescriptor {
    return new ScannedRequestContentTypeDescriptor(
      REQUEST_CONTENT_TYPE_REGISTRY[RequestContentType.Multipart]
    ) as MultipartRequestContentTypeDescriptor;
  }

  public static urlEncoded(): UrlEncodedRequestContentTypeDescriptor {
    return new ScannedRequestContentTypeDescriptor(
      REQUEST_CONTENT_TYPE_REGISTRY[RequestContentType.UrlEncoded]
    ) as UrlEncodedRequestContentTypeDescriptor;
  }

  public static none(): NoneRequestContentTypeDescriptor {
    return new ScannedRequestContentTypeDescriptor(
      REQUEST_CONTENT_TYPE_REGISTRY[RequestContentType.None]
    ) as NoneRequestContentTypeDescriptor;
  }

  public static fromKind(kind: RequestContentType): RequestContentTypeDescriptor {
    const spec = REQUEST_CONTENT_TYPE_REGISTRY[kind] ?? REQUEST_CONTENT_TYPE_REGISTRY[RequestContentType.None];
    return new ScannedRequestContentTypeDescriptor(spec) as RequestContentTypeDescriptor;
  }
}

export interface RequestContentTypeVisitor<R> {
  readonly json: (desc: JsonRequestContentTypeDescriptor) => R;
  readonly multipart: (desc: MultipartRequestContentTypeDescriptor) => R;
  readonly urlEncoded: (desc: UrlEncodedRequestContentTypeDescriptor) => R;
  readonly none: (desc: NoneRequestContentTypeDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik RequestContentType dengan exhaustive type safety
 */
export function matchRequestContentType<R>(
  contentType: RequestContentType | RequestContentTypeDescriptor,
  visitor: RequestContentTypeVisitor<R>
): R {
  const kind: RequestContentType = typeof contentType === 'string' ? contentType : contentType.kind;
  const descriptor = ScannedRequestContentTypeDescriptor.fromKind(kind);
  const DISPATCH: Record<RequestContentType, (d: any) => R> = {
    [RequestContentType.Json]: visitor.json,
    [RequestContentType.Multipart]: visitor.multipart,
    [RequestContentType.UrlEncoded]: visitor.urlEncoded,
    [RequestContentType.None]: visitor.none
  };
  return DISPATCH[kind](descriptor);
}

export interface RouteQueryParameter {
  readonly name: string;
  readonly propertyName: string;
  readonly required: boolean;
  readonly type: RouteParameterType;
  readonly isArray: boolean;
  readonly default: unknown;
}

/**
 * Canonical Laravel Error Types (SSOT)
 */
export interface LaravelValidationError {
  readonly message: string;
  readonly errors: Record<string, readonly string[]>;
}

export interface LaravelUnauthorizedError {
  readonly message: string;
}

export interface LaravelForbiddenError {
  readonly message: string;
}

export interface LaravelNotFoundError {
  readonly message: string;
}

export interface LaravelServerError {
  readonly message: string;
}

/**
 * HttpErrorKind
 *
 * Canonical Domain Vocabulary for HTTP Error Response Categories.
 */
export const HttpErrorKind = Object.freeze({
  Validation: 'validation',
  Unauthorized: 'unauthorized',
  Forbidden: 'forbidden',
  NotFound: 'notFound',
  ServerError: 'serverError',
  Custom: 'custom'
} as const);

export type HttpErrorKind = typeof HttpErrorKind[keyof typeof HttpErrorKind];

export interface HttpErrorKindSpecification<K extends HttpErrorKind = HttpErrorKind> {
  readonly kind: K;
  readonly defaultStatusCode: HttpStatusCode;
  readonly defaultName: string;
  readonly defaultTypeName: string;
  readonly isClientError: boolean;
  readonly isServerError: boolean;
}

export type HttpErrorKindRegistry = {
  readonly [K in HttpErrorKind]: HttpErrorKindSpecification<K>;
};

export const HTTP_ERROR_KIND_REGISTRY: HttpErrorKindRegistry = Object.freeze({
  [HttpErrorKind.Validation]: {
    kind: HttpErrorKind.Validation,
    defaultStatusCode: HttpStatusCode.UnprocessableEntity,
    defaultName: 'UnprocessableEntity',
    defaultTypeName: 'LaravelValidationError',
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.Unauthorized]: {
    kind: HttpErrorKind.Unauthorized,
    defaultStatusCode: HttpStatusCode.Unauthorized,
    defaultName: 'Unauthorized',
    defaultTypeName: 'LaravelUnauthorizedError',
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.Forbidden]: {
    kind: HttpErrorKind.Forbidden,
    defaultStatusCode: HttpStatusCode.Forbidden,
    defaultName: 'Forbidden',
    defaultTypeName: 'LaravelForbiddenError',
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.NotFound]: {
    kind: HttpErrorKind.NotFound,
    defaultStatusCode: HttpStatusCode.NotFound,
    defaultName: 'NotFound',
    defaultTypeName: 'LaravelNotFoundError',
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.ServerError]: {
    kind: HttpErrorKind.ServerError,
    defaultStatusCode: HttpStatusCode.InternalServerError,
    defaultName: 'InternalServerError',
    defaultTypeName: 'LaravelServerError',
    isClientError: false,
    isServerError: true
  },
  [HttpErrorKind.Custom]: {
    kind: HttpErrorKind.Custom,
    defaultStatusCode: HttpStatusCode.BadRequest,
    defaultName: 'BadRequest',
    defaultTypeName: 'LaravelError',
    isClientError: true,
    isServerError: false
  }
});

export interface HttpErrorVisitor<R> {
  readonly validation: (desc: HttpErrorResponseDescriptor) => R;
  readonly unauthorized: (desc: HttpErrorResponseDescriptor) => R;
  readonly forbidden: (desc: HttpErrorResponseDescriptor) => R;
  readonly notFound: (desc: HttpErrorResponseDescriptor) => R;
  readonly serverError: (desc: HttpErrorResponseDescriptor) => R;
  readonly custom: (desc: HttpErrorResponseDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian HttpErrorResponseDescriptor dengan exhaustive type safety
 */
export function matchHttpError<R>(
  error: HttpErrorResponseDescriptor | HttpErrorKind,
  visitor: HttpErrorVisitor<R>
): R {
  const isKindString = typeof error === 'string';
  const kind = isKindString ? error : (error.kind ?? HttpErrorKind.Custom);
  const descriptor: HttpErrorResponseDescriptor = isKindString
    ? {
        kind,
        statusCode: HTTP_ERROR_KIND_REGISTRY[kind].defaultStatusCode,
        name: HTTP_ERROR_KIND_REGISTRY[kind].defaultName,
        typeName: HTTP_ERROR_KIND_REGISTRY[kind].defaultTypeName,
        schema: Object.freeze({})
      }
    : error;
  return visitor[kind](descriptor);
}

export interface HttpErrorResponseDescriptor {
  readonly kind: HttpErrorKind;
  readonly statusCode: HttpStatusCode;
  readonly name: string;
  readonly typeName: string;
  readonly schema: Record<string, unknown>;
}


/**
 * RoutePolicyKind
 *
 * Canonical ADT discriminator for Laravel route authorization policies.
 */
export const RoutePolicyKind = Object.freeze({
  AbilityModel: 'ability_model',
  Gate: 'gate',
  Custom: 'custom'
} as const);

export type RoutePolicyKind = typeof RoutePolicyKind[keyof typeof RoutePolicyKind];

export interface RoutePolicyKindSpecification<K extends RoutePolicyKind = RoutePolicyKind> {
  readonly kind: K;
  readonly requiresModel: boolean;
  readonly description: string;
}

export type RoutePolicyKindRegistry = {
  readonly [K in RoutePolicyKind]: RoutePolicyKindSpecification<K>;
};

export const ROUTE_POLICY_REGISTRY: RoutePolicyKindRegistry = Object.freeze({
  [RoutePolicyKind.AbilityModel]: {
    kind: RoutePolicyKind.AbilityModel,
    requiresModel: true,
    description: 'Laravel Model Policy checking ability against a model parameter'
  },
  [RoutePolicyKind.Gate]: {
    kind: RoutePolicyKind.Gate,
    requiresModel: false,
    description: 'Laravel Gate authorization checking ability without model parameter'
  },
  [RoutePolicyKind.Custom]: {
    kind: RoutePolicyKind.Custom,
    requiresModel: false,
    description: 'Custom authorization policy or middleware rule'
  }
});

export interface RoutePolicyVisitor<R> {
  readonly ability_model: (desc: RoutePolicyDescriptor) => R;
  readonly gate: (desc: RoutePolicyDescriptor) => R;
  readonly custom: (desc: RoutePolicyDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian RoutePolicyDescriptor dengan exhaustive type safety
 */
export function matchRoutePolicy<R>(
  policy: RoutePolicyDescriptor | RoutePolicyKind,
  visitor: RoutePolicyVisitor<R>
): R {
  const isKindString = typeof policy === 'string';
  const kind = isKindString ? policy : (policy.kind ?? (policy.modelParameter ? RoutePolicyKind.AbilityModel : RoutePolicyKind.Gate));
  const descriptor: RoutePolicyDescriptor = isKindString
    ? {
        kind,
        ability: '',
        modelParameter: ROUTE_POLICY_REGISTRY[kind].requiresModel ? 'model' : null
      }
    : policy;
  return visitor[kind](descriptor);
}

/**
 * RoutePolicyDescriptor
 *
 * Explicit Domain Model for Laravel Route Authorization Policies.
 */
export interface RoutePolicyDescriptor {
  readonly kind: RoutePolicyKind;
  readonly ability: string;        // e.g. 'update', 'view'
  readonly modelParameter: string | null;// e.g. 'order'
}

