/**
 * Compatibility barrel for legacy IR imports.
 * Canonical domain vocabulary lives in ../upstream.
 */
export type {
  ModelName, ResourceName, PropertyName, RouteParameterName, VariableName, ClassName,
  ColumnName, RelationName, RouteName, RoutePath, ControllerName, RequestName, ActionName,
  ConstantName, IndexName, ExceptionName, MethodName, ResponseTypeName, SourceFile,
  DomainTypeName, TableName, MiddlewareName, TraitName,
} from '../upstream/names';
export type { DescriptionText, GenerationTimestamp, NumberValue } from '../upstream/valueObjects';
import type { NumberValue } from '../upstream/valueObjects';
import type { SourceFile } from '../upstream/names';
export type SourceFilePath = SourceFile;
export type { SourceSpan } from '../upstream/provenance';
export type SourceLineNumber = NumberValue;
export type { TypeExpression } from '../upstream/typeVocabulary';
export { createPropertyName, createRequestName, createResponseTypeName } from '../upstream/names';

// These atoms have no equivalent in the canonical upstream vocabulary yet.
export type EndpointId = string & { readonly __endpointId: unique symbol };
export type ResourceId = string & { readonly __resourceId: unique symbol };
export type RequestId = string & { readonly __requestId: unique symbol };
export type CodeExpression = string & { readonly __codeExpression: unique symbol };
export type HttpHeaderName = string & { readonly __httpHeaderName: unique symbol };

export type HttpStatus =
  | 200 | 201 | 202 | 204 | 301 | 302 | 304
  | 400 | 401 | 403 | 404 | 409 | 422 | 429
  | 500 | 502 | 503;

export const createEndpointId = (value: string): EndpointId => value as EndpointId;
export const createResourceId = (value: string): ResourceId => value as ResourceId;
export const createRequestId = (value: string): RequestId => value as RequestId;
export const createSourceFilePath = (value: string): SourceFilePath => Object.freeze({ kind: 'source_file' as const, value: Object.freeze({ kind: 'string_value' as const, value }) });
export const createSourceLineNumber = (value: number): SourceLineNumber => Object.freeze({ kind: 'number_value', value });
export const createCodeExpression = (value: string): CodeExpression => value as CodeExpression;
export const createHttpHeaderName = (value: string): HttpHeaderName => value as HttpHeaderName;
