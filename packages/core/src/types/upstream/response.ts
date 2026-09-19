import type { Expression } from './expression';
import type { ResourceName, ResponseTypeName } from './names';
import type { SemanticValue } from './primitiveVocabulary';
import type { SourceSpan } from './provenance';
import type { HttpStatusCode } from './valueObjects';
import type { TypeExpression } from './typeVocabulary';

export type ResponsePayload =
  | { readonly kind: 'value'; readonly value: SemanticValue }
  | { readonly kind: 'resource'; readonly resource: ResourceName }
  | { readonly kind: 'resource_collection'; readonly resource: ResourceName }
  | { readonly kind: 'expression'; readonly expression: Expression }
  | { readonly kind: 'redirect'; readonly target: Expression }
  | { readonly kind: 'download'; readonly file: Expression; readonly filename: Expression };
export type ResponseTransport = { readonly kind: 'json' } | { readonly kind: 'redirect' } | { readonly kind: 'download' };
export type ResponseWrapper =
  | { readonly kind: 'none' }
  | { readonly kind: 'resource'; readonly resource: ResourceName }
  | { readonly kind: 'resource_collection'; readonly resource: ResourceName }
  | { readonly kind: 'paginated'; readonly resource: ResourceName; readonly pagination: PaginationKind };
export type PaginationKind =
  | { readonly kind: 'paginate' }
  | { readonly kind: 'simple_paginate' }
  | { readonly kind: 'cursor_paginate' };
export type ResponseDefinition = {
  readonly kind: 'response';
  readonly typeName: ResponseTypeName;
  readonly output: TypeExpression;
  readonly payload: ResponsePayload;
  readonly wrapper: ResponseWrapper;
  readonly transport: ResponseTransport;
  readonly status: HttpStatusCode;
  readonly source: SourceSpan;
};
export type ResponseContract = { readonly kind: 'response_contract'; readonly definition: ResponseDefinition };
