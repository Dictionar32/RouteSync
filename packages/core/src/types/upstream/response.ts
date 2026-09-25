import type { Expression } from './expression';
import type { ResponseTypeName, HttpErrorName } from './names';
import type { SemanticValue } from './primitiveVocabulary';
import type { ModelReference, ResourceReference } from './semanticReferences';
import type { SourceSpan } from './provenance';
import type { HttpStatusCode, StringValue, TruthValue } from './valueObjects';
import type { Sequence } from './collections';
import type { TypeExpression } from './typeVocabulary';

export type ResponseHeaderName = { readonly kind: 'response_header_name'; readonly value: StringValue };
export type ResponseCookieName = { readonly kind: 'response_cookie_name'; readonly value: StringValue };

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

export type ResponseView = {
  readonly kind: 'view';
  readonly view: Expression;
  readonly data: Expression;
};

export type ResponseContent =
  | { readonly kind: 'json'; readonly shape: ResponseJsonShape }
  | { readonly kind: 'json_with_callback'; readonly shape: ResponseJsonShape; readonly callback: Expression }
  | { readonly kind: 'view'; readonly view: ResponseView }
  | { readonly kind: 'text'; readonly body: Expression }
  | { readonly kind: 'file'; readonly file: Expression }
  | { readonly kind: 'download'; readonly file: Expression; readonly filename: Expression }
  | { readonly kind: 'stream'; readonly callback: Expression }
  | { readonly kind: 'stream_json'; readonly payload: Expression }
  | { readonly kind: 'event_stream'; readonly callback: Expression }
  | { readonly kind: 'stream_download'; readonly callback: Expression; readonly filename: Expression }
  | { readonly kind: 'empty' };

export type ResponseBody = ResponseContent;

export type ResponseHeader = {
  readonly kind: 'response_header';
  readonly name: ResponseHeaderName;
  readonly value: Expression;
};

export type ResponseCookieAttribute =
  | { readonly kind: 'specified'; readonly value: Expression }
  | { readonly kind: 'not_specified' };

export type ResponseCookie = {
  readonly kind: 'response_cookie';
  readonly name: ResponseCookieName;
  readonly value: Expression;
  readonly expires: ResponseCookieAttribute;
  readonly path: ResponseCookieAttribute;
  readonly domain: ResponseCookieAttribute;
  readonly secure: TruthValue;
  readonly httpOnly: TruthValue;
  readonly raw: TruthValue;
};

export type ResponseTransport = {
  readonly kind: 'response_transport';
  readonly headers: Sequence<ResponseHeader>;
  readonly cookies: Sequence<ResponseCookie>;
};

export type ResponseStatusOrigin =
  | { readonly kind: 'framework_default' }
  | { readonly kind: 'source_explicit'; readonly status: HttpStatusCode };

export type ResponseStatus = {
  readonly kind: 'response_status';
  readonly value: HttpStatusCode;
  readonly origin: ResponseStatusOrigin;
};

export type ResponseRedirect =
  | { readonly kind: 'away'; readonly target: Expression }
  | { readonly kind: 'internal'; readonly target: Expression }
  | { readonly kind: 'route'; readonly target: Expression }
  | { readonly kind: 'action'; readonly target: Expression }
  | { readonly kind: 'intended'; readonly fallback: Expression };

export type ResponseResult =
  | { readonly kind: 'branches'; readonly branches: Sequence<ResponseResult> }
  | { readonly kind: 'content'; readonly body: ResponseContent; readonly status: ResponseStatus }
  | { readonly kind: 'redirect'; readonly redirect: ResponseRedirect; readonly status: ResponseStatus }
  | { readonly kind: 'no_content'; readonly status: ResponseStatus }
  | { readonly kind: 'resource'; readonly resource: ResourceReference; readonly model: ModelReference; readonly status: ResponseStatus }
  | { readonly kind: 'responsable'; readonly type: TypeExpression; readonly status: ResponseStatus }
  | { readonly kind: 'json_serializable'; readonly type: TypeExpression; readonly status: ResponseStatus };

export type ResponseFailure = {
  readonly kind: 'response_failure';
  readonly error: HttpErrorName;
  readonly status: HttpStatusCode;
  readonly message: StringValue;
  readonly source: SourceSpan;
};

export type ResponseOutcome =
  | { readonly kind: 'success'; readonly result: ResponseResult }
  | { readonly kind: 'failure'; readonly failure: ResponseFailure };

export type ResponseDefinition = {
  readonly kind: 'response';
  readonly typeName: ResponseTypeName;
  readonly output: TypeExpression;
  readonly transport: ResponseTransport;
  readonly outcome: ResponseOutcome;
  readonly source: SourceSpan;
};

export type ResponseFacts = {
  readonly kind: 'response_facts';
  readonly identity: import('./semanticReferences').ResponseReference;
  readonly typeName: ResponseTypeName;
  readonly output: TypeExpression;
  readonly transport: ResponseTransport;
  readonly outcome: ResponseOutcome;
  readonly source: SourceSpan;
};

export type ResponseContract = {
  readonly kind: 'response_contract';
  readonly definition: ResponseDefinition;
};
