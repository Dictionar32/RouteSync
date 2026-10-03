import type { RouteParameterType } from "./parameters";
import { createPropertyName, type PropertyName, type RouteParameterName } from "../upstream/names";
import type { Presence, Cardinality } from "../upstream/primitiveVocabulary";
import type { Option } from "../upstream/collections";
import type { HttpErrorSchema as UpstreamHttpErrorSchema, HttpErrorSchemaField as UpstreamHttpErrorSchemaField } from "../upstream/routeErrorVocabulary";
import type { RequestRuntimeValue } from "./requestModels";
import { HttpStatusCode } from "./httpVocabulary";
import { SemanticValueFactory, type HttpErrorName, type ResponseTypeName } from "./semanticValues";
import { relationGate } from "../../semantic/kernel/relationalSequence";

export interface RouteQueryParameter {
  readonly name: RouteParameterName;
  readonly propertyName: PropertyName;
  readonly presence: Presence;
  readonly type: RouteParameterType;
  readonly cardinality: Cardinality;
  readonly defaultValue: Option<RequestRuntimeValue>;
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
export type HttpErrorSchemaField = UpstreamHttpErrorSchemaField;
export type HttpErrorSchema = UpstreamHttpErrorSchema;

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
    defaultName: SemanticValueFactory.httpErrorName('UnprocessableEntity'),
    defaultTypeName: SemanticValueFactory.responseTypeName('LaravelValidationError'),
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.Unauthorized]: {
    kind: HttpErrorKind.Unauthorized,
    defaultStatusCode: HttpStatusCode.Unauthorized,
    defaultName: SemanticValueFactory.httpErrorName('Unauthorized'),
    defaultTypeName: SemanticValueFactory.responseTypeName('LaravelUnauthorizedError'),
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.Forbidden]: {
    kind: HttpErrorKind.Forbidden,
    defaultStatusCode: HttpStatusCode.Forbidden,
    defaultName: SemanticValueFactory.httpErrorName('Forbidden'),
    defaultTypeName: SemanticValueFactory.responseTypeName('LaravelForbiddenError'),
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.NotFound]: {
    kind: HttpErrorKind.NotFound,
    defaultStatusCode: HttpStatusCode.NotFound,
    defaultName: SemanticValueFactory.httpErrorName('NotFound'),
    defaultTypeName: SemanticValueFactory.responseTypeName('LaravelNotFoundError'),
    isClientError: true,
    isServerError: false
  },
  [HttpErrorKind.ServerError]: {
    kind: HttpErrorKind.ServerError,
    defaultStatusCode: HttpStatusCode.InternalServerError,
    defaultName: SemanticValueFactory.httpErrorName('InternalServerError'),
    defaultTypeName: SemanticValueFactory.responseTypeName('LaravelServerError'),
    isClientError: false,
    isServerError: true
  },
  [HttpErrorKind.Custom]: {
    kind: HttpErrorKind.Custom,
    defaultStatusCode: HttpStatusCode.BadRequest,
    defaultName: SemanticValueFactory.httpErrorName('BadRequest'),
    defaultTypeName: SemanticValueFactory.responseTypeName('LaravelError'),
    isClientError: true,
    isServerError: false
  }
});

const HTTP_ERROR_MESSAGE_SCHEMA: HttpErrorSchema = Object.freeze({
  kind: 'object',
  fields: Object.freeze([
    Object.freeze([createPropertyName('message'), Object.freeze({ typeName: SemanticValueFactory.responseTypeName('string'), nullable: { kind: 'non_nullable' } })] as const)
  ])
});

const HTTP_ERROR_VALIDATION_SCHEMA: HttpErrorSchema = Object.freeze({
  kind: 'object',
  fields: Object.freeze([
    Object.freeze([createPropertyName('message'), Object.freeze({ typeName: SemanticValueFactory.responseTypeName('string'), nullable: { kind: 'non_nullable' } })] as const),
    Object.freeze([createPropertyName('errors'), Object.freeze({ typeName: SemanticValueFactory.responseTypeName('Record<string, string[]>'), nullable: { kind: 'non_nullable' } })] as const)
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

export interface HttpErrorResponseDescriptor {
  readonly kind: HttpErrorKind;
  readonly statusCode: HttpStatusCode;
  readonly name: HttpErrorName;
  readonly typeName: ResponseTypeName;
  readonly schema: HttpErrorSchema;
}

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
  const kind = relationGate(typeof error === 'string', () => error as HttpErrorKind, () => (error as HttpErrorResponseDescriptor).kind);
  const descriptor = relationGate(typeof error === 'string', () => httpErrorResponseFromKind(kind), () => error as HttpErrorResponseDescriptor);
  return visitor[kind](descriptor);
}export type HttpErrorResponse = HttpErrorResponseDescriptor;

const httpErrorResponseFromKind = (kind: HttpErrorKind): HttpErrorResponseDescriptor => ({
  kind,
  statusCode: HTTP_ERROR_KIND_REGISTRY[kind].defaultStatusCode,
  name: HTTP_ERROR_KIND_REGISTRY[kind].defaultName,
  typeName: HTTP_ERROR_KIND_REGISTRY[kind].defaultTypeName,
  schema: HTTP_ERROR_SCHEMA_REGISTRY[kind]
});

export const createHttpErrorResponse = (input: {
  readonly kind?: HttpErrorKind;
  readonly statusCode?: HttpStatusCode;
  readonly name?: string;
  readonly typeName?: string;
  readonly schema?: HttpErrorSchema;
} = {}): HttpErrorResponseDescriptor => {
  const kind = relationGate(Object.prototype.hasOwnProperty.call(input, 'kind'), () => input.kind as HttpErrorKind, () => HttpErrorKind.Custom);
  const base = httpErrorResponseFromKind(kind);
  return Object.freeze({
    kind,
    statusCode: relationGate(Object.prototype.hasOwnProperty.call(input, 'statusCode'), () => input.statusCode as HttpStatusCode, () => base.statusCode),
    name: relationGate(Object.prototype.hasOwnProperty.call(input, 'name'), () => SemanticValueFactory.httpErrorName(input.name as string), () => base.name),
    typeName: relationGate(Object.prototype.hasOwnProperty.call(input, 'typeName'), () => SemanticValueFactory.responseTypeName(input.typeName as string), () => base.typeName),
    schema: relationGate(Object.prototype.hasOwnProperty.call(input, 'schema'), () => input.schema as HttpErrorSchema, () => base.schema)
  });
};

export const httpErrorResponseValidation = (): HttpErrorResponseDescriptor => httpErrorResponseFromKind(HttpErrorKind.Validation);
export const httpErrorResponseUnauthorized = (): HttpErrorResponseDescriptor => httpErrorResponseFromKind(HttpErrorKind.Unauthorized);
export const httpErrorResponseForbidden = (): HttpErrorResponseDescriptor => httpErrorResponseFromKind(HttpErrorKind.Forbidden);
export const httpErrorResponseNotFound = (): HttpErrorResponseDescriptor => httpErrorResponseFromKind(HttpErrorKind.NotFound);
export const httpErrorResponseServerError = (): HttpErrorResponseDescriptor => httpErrorResponseFromKind(HttpErrorKind.ServerError);
export const httpErrorResponseBadRequest = (): HttpErrorResponseDescriptor => createHttpErrorResponse({ kind: HttpErrorKind.Custom, statusCode: HttpStatusCode.BadRequest, name: 'BadRequest', typeName: 'LaravelBadRequestError' });
export const httpErrorResponseCustom = (statusCode: HttpStatusCode, name: string, typeName?: string, schema?: HttpErrorSchema): HttpErrorResponseDescriptor => createHttpErrorResponse({ kind: HttpErrorKind.Custom, statusCode, name, typeName, schema });


