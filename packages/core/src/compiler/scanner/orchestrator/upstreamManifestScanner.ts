import { scanSourceAsts } from './sourceAstScanner';
import { validateCompleteSourceAst } from '../../../types/upstream/completeness';
import { buildCompleteLaravelSourceModel, type CompleteSourceModelBuildResult, type SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { CompleteSourceAst } from '../../../types/upstream/ast';
import type { RouteSyncManifest } from '../../../types/upstream/manifest';
import type { NumberValue } from '../../../types/upstream/valueObjects';
import type { SourceSpan } from '../../../types/upstream/provenance';

const numberValue = (value: number): NumberValue => ({ kind: 'number_value', value });

const version = () => ({ kind: 'manifest_version' as const, major: numberValue(6), minor: numberValue(0), patch: numberValue(0) });

function complete(ast: Awaited<ReturnType<typeof scanSourceAsts>>, sourceSpan: SourceSpan): CompleteSourceAst {
  const result = validateCompleteSourceAst(ast, sourceSpan);
  if (result.kind === 'complete_source_ast') return result;
  throw new Error(`Incomplete upstream source AST: ${result.failures.kind}`);
}

export async function scanRouteSyncManifest(sourceProject: SourceProjectIdentity): Promise<RouteSyncManifest> {
  const ast = await scanSourceAsts(sourceProject);
  const sourceSpan = sourceProject.source;
  const completeAst = complete(ast, sourceSpan);
  const completeLaravelSourceModel: CompleteSourceModelBuildResult = buildCompleteLaravelSourceModel(
    completeAst,
    sourceProject,
  );
  return {
    kind: 'route_sync_manifest',
    version: version(),
    source: { kind: 'laravel_application', root: sourceProject.root, source: sourceSpan },
    ast: completeAst,
    sourceModel: completeLaravelSourceModel,
  };
}
