/**
 * Canonical migration AST producer for the model scanner.
 * The migration AST remains the source of table/column meaning; no string-keyed
 * schema map is introduced between MigrationAst and ModelAst.
 */
import { scanMigrationAsts } from '../migrationAstCanonical';
import type { SourceProjectIdentity } from '../../../../types/upstream/highLevelSourceModel';
import type { MigrationAst } from '../../../../types/upstream/ast';

export async function scanMigrations(
    sourceProject: SourceProjectIdentity
): Promise<readonly MigrationAst[]> {
    return scanMigrationAsts(sourceProject);
}
