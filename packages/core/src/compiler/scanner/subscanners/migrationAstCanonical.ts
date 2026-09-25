import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { MigrationAst } from '../../../types/upstream/ast';
import type { SourceFile } from '../../../types/upstream/names';
import type { SourceSpan } from '../../../types/upstream/provenance';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { collectPhpFiles, readSourceText } from './scannerUtils';
import { migrationProducer, type MigrationSourceAst } from './migrationProducer';
import { parsePhpMethod } from '../lexer/phpMethodParser';
import * as path from 'node:path';

function source(file: string): SourceSpan {
  return { kind: 'source_span', file: { kind: 'source_file', value: { kind: 'string_value', value: file } }, start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: 0 } };
}

function parseMigrationMethods(text: string, tokens: readonly import('../LaravelSourceLexer').TokenDescriptor[]): readonly import('../lexer/phpMethodAstTypes').PhpMethodAst[] {
  const methods: import('../lexer/phpMethodAstTypes').PhpMethodAst[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i].value !== 'function') continue;
    const method = parsePhpMethod(text, tokens, i);
    if (method) methods.push(method);
  }
  return Object.freeze(methods);
}

export async function scanMigrationAsts(sourceProject: SourceProjectIdentity): Promise<readonly MigrationAst[]> {
  const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'database', 'migrations');
  const files = await collectPhpFiles(directory);
  const asts: MigrationAst[] = [];
  for (const file of files) {
    const text = await readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(text);
    const span = source(file);
    const sourceAst: MigrationSourceAst = { kind: 'migration_source_ast', methods: parseMigrationMethods(text, tokens), tokens, source: span };
    const fileName: SourceFile = { kind: 'source_file', value: { kind: 'string_value', value: file } };
    const ast = migrationProducer.produce({ source: sourceAst, file: fileName, sourceSpan: span });
    if (ast.definition.operations.items.kind === 'empty') continue;
    asts.push(ast);
  }
  return Object.freeze(asts);
}
