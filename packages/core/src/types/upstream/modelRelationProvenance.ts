import type { ForeignKey } from './databaseVocabulary';
import type { MigrationProvenance, SourceSpan } from './provenance';

/** Closed semantic lineage for a reconciled model relation. AST remains evidence only. */
export type ModelRelationProvenance = Readonly<{
  readonly kind: 'model_relation_provenance';
  readonly relationSource: SourceSpan;
  readonly schema: Readonly<{
    readonly kind: 'schema_foreign_key_evidence';
    readonly foreignKey: ForeignKey;
    readonly tableSource: SourceSpan;
    readonly migrationProvenance: readonly MigrationProvenance[];
  }>;
}>;
