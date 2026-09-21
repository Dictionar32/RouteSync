import { scanSourceAsts } from './sourceAstScanner';
import { validateCompleteSourceAst } from '../../../types/upstream/completeness';
import { buildCompleteLaravelSourceModel, type CompleteSourceModelBuildResult, type SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { Sequence } from '../../../types/upstream/collections';
import type { CompleteSourceAst } from '../../../types/upstream/ast';
import type { RouteSyncManifest } from '../../../types/upstream/manifest';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { SourceFile } from '../../../types/upstream/names';
import type { NumberValue, StringValue } from '../../../types/upstream/valueObjects';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const numberValue = (value: number): NumberValue => ({ kind: 'number_value', value });
const source = (file: string): SourceSpan => ({
  kind: 'source_span',
  file: { kind: 'source_file', value: stringValue(file) },
  start: numberValue(1),
  end: numberValue(1),
});

const root = (projectRoot: string): SourceFile => ({ kind: 'source_file', value: stringValue(projectRoot) });
const version = () => ({ kind: 'manifest_version' as const, major: numberValue(6), minor: numberValue(0), patch: numberValue(0) });
const sourceIdentity = (projectRoot: string, span: SourceSpan): SourceProjectIdentity => ({
  kind: 'laravel_project',
  root: root(projectRoot),
  source: span,
});

const emptySequence = <T>(): Sequence<T> => ({ kind: 'empty' });

function complete(ast: Awaited<ReturnType<typeof scanSourceAsts>>, sourceSpan: SourceSpan): CompleteSourceAst {
  const result = validateCompleteSourceAst(ast, sourceSpan);
  if (result.kind === 'complete_source_ast') return result;
  throw new Error(`Incomplete upstream source AST: ${result.failures.kind}`);
}

export async function scanRouteSyncManifest(projectRoot: string): Promise<RouteSyncManifest> {
  const ast = await scanSourceAsts(projectRoot);
  const sourceSpan = source(projectRoot);
  const completeAst = complete(ast, sourceSpan);
  const completeLaravelSourceModel: CompleteSourceModelBuildResult = buildCompleteLaravelSourceModel(
    completeAst,
    sourceIdentity(projectRoot, sourceSpan),
  );
  return {
    kind: 'route_sync_manifest',
    version: version(),
    source: { kind: 'laravel_application', root: root(projectRoot), source: sourceSpan },
    ast: completeAst,
    sourceModel: completeLaravelSourceModel,
  };
}
