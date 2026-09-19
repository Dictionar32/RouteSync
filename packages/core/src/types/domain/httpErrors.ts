import type { RouteParameterType } from "./parameters";
import { HttpStatusCode } from "./httpVocabulary";
import type { HttpErrorName, ResponseTypeName } from "./semanticValues";

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
  readonly defaultName: HttpErrorName;
  readonly defaultTypeName: ResponseTypeName;
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
    defaultName: { kind: 'http_error_name', value: 'UnprocessableEntity' },
    defaultTypeName: { kind: 'response_type_name', value: 'LaravelValidationError' },
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.Unauthorized]: {
    kind: HttpErrorKind.Unauthorized,
    defaultStatusCode: HttpStatusCode.Unauthorized,
    defaultName: { kind: 'http_error_name', value: 'Unauthorized' },
    defaultTypeName: { kind: 'response_type_name', value: 'LaravelUnauthorizedError' },
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.Forbidden]: {
    kind: HttpErrorKind.Forbidden,
    defaultStatusCode: HttpStatusCode.Forbidden,
    defaultName: { kind: 'http_error_name', value: 'Forbidden' },
    defaultTypeName: { kind: 'response_type_name', value: 'LaravelForbiddenError' },
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.NotFound]: {
    kind: HttpErrorKind.NotFound,
    defaultStatusCode: HttpStatusCode.NotFound,
    defaultName: { kind: 'http_error_name', value: 'NotFound' },
    defaultTypeName: { kind: 'response_type_name', value: 'LaravelNotFoundError' },
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.ServerError]: {
    kind: HttpErrorKind.ServerError,
    defaultStatusCode: HttpStatusCode.InternalServerError,
    defaultName: { kind: 'http_error_name', value: 'InternalServerError' },
    defaultTypeName: { kind: 'response_type_name', value: 'LaravelServerError' },
    isClientError: false,
    isServerError: true
  },
  [HttpErrorKind.Custom]: {
    kind: HttpErrorKind.Custom,
    defaultStatusCode: HttpStatusCode.BadRequest,
    defaultName: { kind: 'http_error_name', value: 'BadRequest' },
    defaultTypeName: { kind: 'response_type_name', value: 'LaravelError' },
    isClientError: true,
    isServerError: false
  }
});

const HTTP_ERROR_MESSAGE_SCHEMA: HttpErrorSchema = Object.freeze({
  kind: 'object',
  fields: Object.freeze([
    Object.freeze(['message', Object.freeze({ typeName: 'string', nullable: false })] as const)
  ])
});

const HTTP_ERROR_VALIDATION_SCHEMA: HttpErrorSchema = Object.freeze({
  kind: 'object',
  fields: Object.freeze([
    Object.freeze(['message', Object.freeze({ typeName: 'string', nullable: false })] as const),
    Object.freeze(['errors', Object.freeze({ typeName: 'Record<string, string[]>', nullable: false })] as const)
  ])
});

export type HttpErrorSchemaRegistry = {
  readonly [K in HttpErrorKind]: HttpErrorSchema;
};

export const HTTP_ERROR_SCHEMA_REGISTRY: HttpErrorSchemaRegistry = Object.freeze({
  [HttpErrorKind.Validation]: HTTP_ERROR_VALIDATION_SCHEMA,
  [HttpErrorKind.Unauthorized]: HTTP_ERROR_MESSAGE_SCHEMA,
  [HttpErrorKind.Forbidden]: HTTP_ERROR_MESSAGE_SCHEMA,
  [HttpErrorKind.NotFound]: HTTP_ERROR_MESSAGE_SCHEMA,
  [HttpErrorKind.ServerError]: HTTP_ERROR_MESSAGE_SCHEMA,
  [HttpErrorKind.Custom]: HTTP_ERROR_MESSAGE_SCHEMA
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
        schema: HTTP_ERROR_SCHEMA_REGISTRY[kind]
      }
    : error;
  return visitor[kind](descriptor);
}

export interface HttpErrorSchemaField {
  readonly typeName: string;
  readonly nullable: boolean;
}

export interface HttpErrorSchema {
  readonly kind: 'object';
  readonly fields: readonly (readonly [string, HttpErrorSchemaField])[];
}

export interface HttpErrorResponseDescriptor {
  readonly kind: HttpErrorKind;
  readonly statusCode: HttpStatusCode;
  readonly name: HttpErrorName;
  readonly typeName: ResponseTypeName;
  readonly schema: HttpErrorSchema;
}
