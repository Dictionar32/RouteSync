import type { RouteParameterType } from "./parameters";
import { HttpStatusCode } from "./httpVocabulary";

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
