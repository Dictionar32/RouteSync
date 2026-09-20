import type { Expression } from './expression';
import type { ResponseTypeName } from './names';
import type { SemanticValue } from './primitiveVocabulary';
import type { ModelReference, ResourceReference } from './semanticReferences';
import type { SourceSpan } from './provenance';
import type { HttpStatusCode } from './valueObjects';
import type { TypeExpression } from './typeVocabulary';

export type ResponseJsonPayload =
  | { readonly kind: 'value'; readonly value: SemanticValue }
  | { readonly kind: 'model'; readonly model: ModelReference }
  | { readonly kind: 'resource'; readonly resource: ResourceReference; readonly model: ModelReference }
  | { readonly kind: 'object'; readonly type: TypeExpression }
  | { readonly kind: 'primitive'; readonly type: TypeExpression }
  | { readonly kind: 'expression'; readonly expression: Expression };

export type PaginationKind =
  | { readonly kind: 'paginate' }
  | { readonly kind: 'simple_paginate' }
  | { readonly kind: 'cursor_paginate' };

export type ResponseJsonShape =
  | { readonly kind: 'single'; readonly payload: ResponseJsonPayload }
  | { readonly kind: 'collection'; readonly payload: ResponseJsonPayload }
  | { readonly kind: 'paginated'; readonly payload: ResponseJsonPayload; readonly pagination: PaginationKind }
  | { readonly kind: 'empty' };

export type ResponseResult =
  | { readonly kind: 'json'; readonly shape: ResponseJsonShape }
  | { readonly kind: 'redirect'; readonly target: Expression }
  | { readonly kind: 'download'; readonly file: Expression; readonly filename: Expression };

export type ResponseDefinition = {
  readonly kind: 'response';
  readonly typeName: ResponseTypeName;
  readonly output: TypeExpression;
  readonly result: ResponseResult;
  readonly status: HttpStatusCode;
  readonly source: SourceSpan;
};

export type ResponseFacts = {
  readonly kind: 'response_facts';
  readonly identity: import('./semanticReferences').ResponseReference;
  readonly typeName: ResponseTypeName;
  readonly output: TypeExpression;
  readonly result: ResponseResult;
  readonly status: HttpStatusCode;
  readonly source: SourceSpan;
};

export type ResponseContract = {
  readonly kind: 'response_contract';
  readonly definition: ResponseDefinition;
};
