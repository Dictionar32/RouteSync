import type { RequestReference, ResponseReference } from './semanticReferences';
import type { TypeExpression } from './typeVocabulary';
import type { UnresolvedPhpParameterTypeJudgment } from './laravelControllerRequestSemanticBinding';
import type { Expression } from './expression';
import type { ClassName } from './names';
import type { HttpStatusCode } from './valueObjects';
import type { ResponseCardinality } from './response';
import type { LaravelControllerMethodResponseProduct } from './laravelControllerResponseSemanticJudgmentInterface';

export type EndpointRequestBinding =
  | { readonly kind: 'form_request'; readonly request: RequestReference }
  | { readonly kind: 'framework_request'; readonly type: ClassName }
  | { readonly kind: 'inline_input'; readonly type: TypeExpression }
  | { readonly kind: 'unresolved_input'; readonly judgment: UnresolvedPhpParameterTypeJudgment }
  | { readonly kind: 'unresolved_action_input'; readonly reason: 'action_judgment_unmatched' | 'action_judgment_ambiguous' | 'action_judgment_provenance_invalid' }
  | { readonly kind: 'no_input' };

export type EndpointRequestParameter =
  | { readonly kind: 'route_parameter'; readonly name: import('./names').RouteParameterName }
  | { readonly kind: 'framework_request'; readonly type: ClassName }
  | { readonly kind: 'form_request'; readonly request: RequestReference };

export type EndpointResponseStatus =
  | { readonly kind: 'implicit_default' }
  | { readonly kind: 'explicit'; readonly status: HttpStatusCode };


export type EndpointResponseBinding =
  | { readonly kind: 'controller_method_response'; readonly product: LaravelControllerMethodResponseProduct }
  | { readonly kind: 'controller_response_projection_blocked'; readonly reason: 'action_judgment_unmatched' | 'action_judgment_ambiguous' | 'action_judgment_provenance_invalid' | 'response_judgment_unavailable' | 'method_response_product_unmatched' | 'method_response_product_ambiguous' | 'method_response_product_not_projectable' | 'closure_response_not_correlated' }
  | { readonly kind: 'declared_response'; readonly response: ResponseReference; readonly cardinality: ResponseCardinality; readonly status: EndpointResponseStatus }
  | { readonly kind: 'inline_response'; readonly type: TypeExpression; readonly status: EndpointResponseStatus }
  | { readonly kind: 'redirect_response'; readonly target: Expression; readonly status: EndpointResponseStatus }
  | { readonly kind: 'file_response'; readonly file: Expression; readonly filename: Expression; readonly status: EndpointResponseStatus }
  | { readonly kind: 'empty_response'; readonly status: EndpointResponseStatus };
