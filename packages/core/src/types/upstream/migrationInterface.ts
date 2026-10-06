import type { MigrationDefinition } from './migration';
import type { SourceSpan } from './provenance';

/**
 * Closed migration semantic interface consumed by schema production.
 * Scanner AST is evidence at the adapter boundary; semantic consumers receive
 * only the migration definition and provenance carried by this interface.
 */
export interface MigrationInterface {
  readonly kind: 'migration_interface';
  readonly definition: MigrationDefinition;
  readonly source: SourceSpan;
  readonly closed: true;
}
