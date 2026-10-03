import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { MigrationAst } from '../../../types/upstream/ast';
import type { SourceFile } from '../../../types/upstream/names';
import type { SourceSpan } from '../../../types/upstream/provenance';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { collectPhpFiles, readSourceText } from './scannerUtils';
import { migrationProducer, type MigrationSourceAst } from './migrationProducer';
import { parsePhpMethodOrThrow } from '../lexer/phpMethodParser';
import * as path from 'node:path';
import { relationAsyncFold, relationFold, relationGate } from '../../../semantic/kernel/relationalSequence';
import { relationEqual, relationNotEqual } from '../../../semantic/kernel/semanticRelations';

function source(file: string): SourceSpan {
  return { kind: 'source_span', file: { kind: 'source_file', value: { kind: 'string_value', value: file } }, start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: 0 } };
}

function parseMigrationMethods(text: string, tokens: readonly import('../LaravelSourceLexer').TokenDescriptor[]): readonly import('../lexer/phpMethodAstTypes').PhpMethodAst[] {
  const methods = relationFold(tokens, [] as import('../lexer/phpMethodAstTypes').PhpMethodAst[], (output, token, index) =>
    relationGate(relationEqual(token.value, 'function'), () => {
      const method = parsePhpMethodOrThrow(text, tokens, index);
      return relationGate(Object.is(typeof method, 'object'), () => [...output, method as import('../lexer/phpMethodAstTypes').PhpMethodAst], () => output);
    }, () => output),
  );
  return Object.freeze(methods);
}

export async function scanMigrationAsts(sourceProject: SourceProjectIdentity): Promise<readonly MigrationAst[]> {
  const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'database', 'migrations');
  const files = await collectPhpFiles(directory);
  const result = await relationAsyncFold(files, [] as MigrationAst[], async (asts, file) => {
    const text = await readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(text);
    const span = source(file);
    const sourceAst: MigrationSourceAst = { kind: 'migration_source_ast', methods: parseMigrationMethods(text, tokens), tokens, source: span };
    const fileName: SourceFile = { kind: 'source_file', value: { kind: 'string_value', value: file } };
    const ast = migrationProducer.produce({ source: sourceAst, file: fileName, sourceSpan: span });
    return relationGate(relationNotEqual(ast.definition.operations.items.kind, 'empty'), () => [...asts, ast], () => asts);
  });
  return Object.freeze(result);
}
