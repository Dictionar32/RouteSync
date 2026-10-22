import type { MigrationAst } from './ast';
import type { SourceProjectIdentity } from './highLevelSourceModel';

/** Upstream contract for discovering the project's canonical migration AST evidence. */
export interface LaravelMigrationScannerInterface {
  readonly kind: 'laravel_migration_scanner';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly scan: (sourceProject: SourceProjectIdentity) => Promise<readonly MigrationAst[]>;
}
