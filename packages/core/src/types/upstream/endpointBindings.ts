import type { RequestReference, ResponseReference } from './semanticReferences';
import type { TypeExpression } from './typeVocabulary';
import type { Expression } from './expression';
import type { ClassName } from './names';
import type { HttpStatusCode } from './valueObjects';

export type EndpointRequestBinding =
  | { readonly kind: 'form_request'; readonly request: RequestReference }
  | { readonly kind: 'framework_request'; readonly type: ClassName }
  | { readonly kind: 'inline_input'; readonly type: TypeExpression }
  | { readonly kind: 'no_input' };

export type EndpointRequestParameter =
  | { readonly kind: 'route_parameter'; readonly name: import('./names').RouteParameterName }
  | { readonly kind: 'framework_request'; readonly type: ClassName }
  | { readonly kind: 'form_request'; readonly request: RequestReference };

export type EndpointResponseStatus =
  | { readonly kind: 'implicit_default' }
  | { readonly kind: 'explicit'; readonly status: HttpStatusCode };

export type ResponseCardinality =
  | { readonly kind: 'single' }
  | { readonly kind: 'collection' };


export type EndpointResponseBinding =
  | { readonly kind: 'declared_response'; readonly response: ResponseReference; readonly cardinality: ResponseCardinality; readonly status: EndpointResponseStatus }
  | { readonly kind: 'inline_response'; readonly type: TypeExpression; readonly status: EndpointResponseStatus }
  | { readonly kind: 'redirect_response'; readonly target: Expression; readonly status: EndpointResponseStatus }
  | { readonly kind: 'file_response'; readonly file: Expression; readonly filename: Expression; readonly status: EndpointResponseStatus }
  | { readonly kind: 'empty_response'; readonly status: EndpointResponseStatus };
