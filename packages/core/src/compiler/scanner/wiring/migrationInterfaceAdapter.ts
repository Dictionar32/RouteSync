/**
 * Scanner boundary adapter from migration AST evidence to the closed upstream
 * migration semantic interface. The upstream interface itself remains free of
 * scanner/AST dependencies.
 */
import type { MigrationAst } from '../../../types/upstream/ast';
import type { MigrationInterface } from '../../../types/upstream/migrationInterface';

export const migrationInterfaceFromAst = (ast: MigrationAst): MigrationInterface => Object.freeze({
  kind: 'migration_interface',
  definition: ast.definition,
  source: ast.source,
  closed: true,
});
