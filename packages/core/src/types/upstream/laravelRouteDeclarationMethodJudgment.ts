import type { HttpMethod } from './routeExecutionVocabulary';
import type { LaravelRouteMethodEvidence, LaravelRouteTargetMethodEvidence } from './routeDeclarationEvidence';

/** Canonical Laravel declaration method vocabulary belongs to the method judgment contract. */
export type LaravelRouteMethod = LaravelRouteMethodEvidence;
export type LaravelResourceRouteMethod = Extract<LaravelRouteMethod, 'resource' | 'apiResource' | 'singleton' | 'apiSingleton'>;
export type LaravelStandardRouteMethod = Exclude<LaravelRouteMethod, LaravelResourceRouteMethod | 'match' | 'any'>;
export type LaravelRouteTargetMethod = LaravelRouteTargetMethodEvidence;

export interface LaravelRouteDeclarationMethodJudgmentInput {
  readonly method: LaravelRouteMethod;
  readonly targetMethods: readonly LaravelRouteTargetMethod[];
}

export type LaravelRouteDeclarationMethodJudgment =
  | Readonly<{ readonly kind: 'laravel_route_declaration_method_resource'; readonly method: LaravelResourceRouteMethod }>
  | Readonly<{ readonly kind: 'laravel_route_declaration_method_all_methods'; readonly method: 'any'; readonly httpMethods: readonly HttpMethod[] }>
  | Readonly<{ readonly kind: 'laravel_route_declaration_method_query'; readonly method: 'query'; readonly httpMethods: readonly [HttpMethod] }>
  | Readonly<{ readonly kind: 'laravel_route_declaration_method_match'; readonly method: 'match'; readonly targetMethods: readonly LaravelRouteTargetMethod[]; readonly httpMethods: readonly HttpMethod[] }>
  | Readonly<{ readonly kind: 'laravel_route_declaration_method_standard'; readonly method: LaravelStandardRouteMethod; readonly httpMethods: readonly [HttpMethod] }>;

export interface LaravelRouteDeclarationMethodJudgmentAuthority {
  readonly kind: 'laravel_route_declaration_method_judgment_authority';
  readonly contractVersion: 8;
  readonly closed: true;
  readonly judge: (input: LaravelRouteDeclarationMethodJudgmentInput) => LaravelRouteDeclarationMethodJudgment;
}
