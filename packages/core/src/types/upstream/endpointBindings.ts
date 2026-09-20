import type { RequestReference, ResponseReference } from './semanticReferences';
import type { TypeExpression } from './typeVocabulary';

export type EndpointRequestBinding =
  | { readonly kind: 'form_request'; readonly request: RequestReference }
  | { readonly kind: 'inline_input'; readonly type: TypeExpression }
  | { readonly kind: 'no_input' };

export type EndpointResponseBinding =
  | { readonly kind: 'declared_response'; readonly response: ResponseReference }
  | { readonly kind: 'inline_response'; readonly type: TypeExpression }
  | { readonly kind: 'empty_response' };
