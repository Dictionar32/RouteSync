import type { MiddlewareAst } from './ast';
import type { SourceProjectIdentity } from './highLevelSourceModel';

/** Source-AST scanner result is explicitly identified as a closed judgment. */
export interface LaravelMiddlewareScanJudgment {
  readonly kind: 'laravel_middleware_scan_judgment';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly asts: readonly MiddlewareAst[];
}

export interface LaravelMiddlewareScannerInterface {
  readonly kind: 'laravel_middleware_scanner';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly scan: (sourceProject: SourceProjectIdentity) => Promise<LaravelMiddlewareScanJudgment>;
}
