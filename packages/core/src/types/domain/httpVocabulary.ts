import type { CrudRole } from "./crudRoles";
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
 * Request content-type vocabulary.
 * The literal wire values remain available through the MIME ADT.
 */
export const RequestContentType = Object.freeze({
  Json: 'application/json',
  Multipart: 'multipart/form-data',
  UrlEncoded: 'application/x-www-form-urlencoded',
  None: 'none'
} as const);

export type RequestContentType = typeof RequestContentType[keyof typeof RequestContentType];

export type RequestMimeType =
  | { readonly kind: 'json'; readonly value: 'application/json' }
  | { readonly kind: 'multipart'; readonly value: 'multipart/form-data' }
  | { readonly kind: 'urlencoded'; readonly value: 'application/x-www-form-urlencoded' }
  | { readonly kind: 'none' };

export type RequestHeaderExpression =
  | { readonly kind: 'content_type'; readonly value: RequestMimeType }
  | { readonly kind: 'none' };

export interface BaseRequestContentTypeDescriptor {
  readonly kind: RequestContentType;
  readonly mimeType: RequestMimeType;
  readonly isBinary: boolean;
  readonly hasPayload: boolean;
}

export interface JsonRequestContentTypeDescriptor extends BaseRequestContentTypeDescriptor {
  readonly kind: 'application/json';
  readonly mimeType: { readonly kind: 'json'; readonly value: 'application/json' };
  readonly isBinary: false;
  readonly hasPayload: true;
}

export interface MultipartRequestContentTypeDescriptor extends BaseRequestContentTypeDescriptor {
  readonly kind: 'multipart/form-data';
  readonly mimeType: { readonly kind: 'multipart'; readonly value: 'multipart/form-data' };
  readonly isBinary: true;
  readonly hasPayload: true;
}

export interface UrlEncodedRequestContentTypeDescriptor extends BaseRequestContentTypeDescriptor {
  readonly kind: 'application/x-www-form-urlencoded';
  readonly mimeType: { readonly kind: 'urlencoded'; readonly value: 'application/x-www-form-urlencoded' };
  readonly isBinary: false;
  readonly hasPayload: true;
}

export interface NoneRequestContentTypeDescriptor extends BaseRequestContentTypeDescriptor {
  readonly kind: 'none';
  readonly mimeType: { readonly kind: 'none' };
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
  readonly mimeType: RequestMimeType;
  readonly isBinary: boolean;
  readonly hasPayload: boolean;
  readonly headerExpression: RequestHeaderExpression;
}

export type RequestContentTypeRegistry = {
  readonly [K in RequestContentType]: RequestContentTypeSpecification<K>;
};

export const REQUEST_CONTENT_TYPE_REGISTRY: RequestContentTypeRegistry = Object.freeze({
  [RequestContentType.Json]: {
    kind: RequestContentType.Json,
    mimeType: { kind: 'json', value: 'application/json' },
    isBinary: false,
    hasPayload: true,
    headerExpression: { kind: 'content_type', value: { kind: 'json', value: 'application/json' } }
  },
  [RequestContentType.Multipart]: {
    kind: RequestContentType.Multipart,
    mimeType: { kind: 'multipart', value: 'multipart/form-data' },
    isBinary: true,
    hasPayload: true,
    headerExpression: { kind: 'content_type', value: { kind: 'multipart', value: 'multipart/form-data' } }
  },
  [RequestContentType.UrlEncoded]: {
    kind: RequestContentType.UrlEncoded,
    mimeType: { kind: 'urlencoded', value: 'application/x-www-form-urlencoded' },
    isBinary: false,
    hasPayload: true,
    headerExpression: { kind: 'content_type', value: { kind: 'urlencoded', value: 'application/x-www-form-urlencoded' } }
  },
  [RequestContentType.None]: {
    kind: RequestContentType.None,
    mimeType: { kind: 'none' },
    isBinary: false,
    hasPayload: false,
    headerExpression: { kind: 'none' }
  }
});

export class ScannedRequestContentTypeDescriptor implements BaseRequestContentTypeDescriptor {
  public readonly kind: RequestContentType;
  public readonly mimeType: RequestMimeType;
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
    return ScannedRequestContentTypeDescriptor.fromKind(RequestContentType.Json) as JsonRequestContentTypeDescriptor;
  }

  public static multipart(): MultipartRequestContentTypeDescriptor {
    return ScannedRequestContentTypeDescriptor.fromKind(RequestContentType.Multipart) as MultipartRequestContentTypeDescriptor;
  }

  public static urlEncoded(): UrlEncodedRequestContentTypeDescriptor {
    return ScannedRequestContentTypeDescriptor.fromKind(RequestContentType.UrlEncoded) as UrlEncodedRequestContentTypeDescriptor;
  }

  public static none(): NoneRequestContentTypeDescriptor {
    return ScannedRequestContentTypeDescriptor.fromKind(RequestContentType.None) as NoneRequestContentTypeDescriptor;
  }

  public static fromKind(kind: RequestContentType): RequestContentTypeDescriptor {
    const spec = REQUEST_CONTENT_TYPE_REGISTRY[kind];
    return new ScannedRequestContentTypeDescriptor(spec) as RequestContentTypeDescriptor;
  }
}

export interface RequestContentTypeVisitor<R> {
  readonly json: (desc: JsonRequestContentTypeDescriptor) => R;
  readonly multipart: (desc: MultipartRequestContentTypeDescriptor) => R;
  readonly urlEncoded: (desc: UrlEncodedRequestContentTypeDescriptor) => R;
  readonly none: (desc: NoneRequestContentTypeDescriptor) => R;
}

export function matchRequestContentType<R>(
  contentType: RequestContentTypeDescriptor,
  visitor: RequestContentTypeVisitor<R>
): R {
  if (contentType.kind === RequestContentType.Json) return visitor.json(contentType);
  if (contentType.kind === RequestContentType.Multipart) return visitor.multipart(contentType);
  if (contentType.kind === RequestContentType.UrlEncoded) return visitor.urlEncoded(contentType);
  return visitor.none(contentType);
}
