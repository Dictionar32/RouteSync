import { relationGate } from '../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../semantic/kernel/semanticRelations';
import { scanSourceAsts } from '../orchestrator/sourceAstScanner';
import { validateCompleteSourceAst } from '../../../types/upstream/completeness';
import { buildCompleteLaravelSourceModel, type SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { CompleteSourceAst } from '../../../types/upstream/ast';
import type { RouteSyncManifest } from '../../../types/upstream/manifest';
import type { NumberValue } from '../../../types/upstream/valueObjects';
import type { SourceSpan } from '../../../types/upstream/provenance';

const numberValue = (value: number): NumberValue => ({ kind: 'number_value', value });

const version = () => ({
  kind: 'manifest_version' as const,
  major: numberValue(6),
  minor: numberValue(0),
  patch: numberValue(0),
});

function complete(ast: Awaited<ReturnType<typeof scanSourceAsts>>, sourceSpan: SourceSpan): CompleteSourceAst {
  const result = validateCompleteSourceAst(ast, sourceSpan);
  return relationGate(relationEqual(result.kind, 'complete_source_ast'), () => result, () => { throw Error(`Incomplete upstream source AST: ${result.failures.kind}`); });
}

/**
 * The only owner of the concrete manifest construction path.
 *
 * AST validation and semantic ADT construction happen here, upstream of the
 * public scanner boundary. Consumers never receive this concrete artifact.
 */
export async function constructRouteSyncManifest(
  sourceProject: SourceProjectIdentity,
): Promise<RouteSyncManifest> {
  const ast = await scanSourceAsts(sourceProject);
  const sourceSpan = sourceProject.source;
  const completeAst = complete(ast, sourceSpan);
  const completeLaravelSourceModelBuildResult = buildCompleteLaravelSourceModel(
    completeAst,
    sourceProject,
  );

  return Object.freeze({
    kind: 'route_sync_manifest' as const,
    version: version(),
    source: {
      kind: 'laravel_application' as const,
      root: sourceProject.root,
      source: sourceSpan,
    },
    ast: completeAst,
    sourceModel: completeLaravelSourceModelBuildResult.value,
  });
}
