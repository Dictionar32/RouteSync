import type { MiddlewareName } from './names';

/** Closed semantic judgment for route authorization evidence. */
export type LaravelRouteAuthorizationSemanticJudgment =
  | Readonly<{
      readonly kind: 'laravel_route_authorization_middleware_present';
      readonly middleware: readonly MiddlewareName[];
    }>
  | Readonly<{
      readonly kind: 'laravel_route_authorization_middleware_absent';
      readonly middleware: readonly MiddlewareName[];
    }>;

/** Upstream authority owns the meaning of middleware evidence for route authorization. */
export interface LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface {
  readonly kind: 'laravel_route_authorization_semantic_judgment_authority';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly judge: (middleware: readonly MiddlewareName[]) => LaravelRouteAuthorizationSemanticJudgment;
}
