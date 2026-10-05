import { relationGate } from '../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../semantic/foundation/semanticRelations';
import { scanSourceAsts } from '../orchestrator/sourceAstScanner';
import { validateCompleteSourceAst } from '../../../types/upstream/completeness';
import { buildCompleteLaravelSourceModel, type SemanticContractSeeds, type SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
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
  const scanned = await scanSourceAsts(sourceProject);
  const sourceSpan = sourceProject.source;
  const completeAst = complete(scanned, sourceSpan);
  const seeds: SemanticContractSeeds = {
    models: scanned.modelDefinitions,
    resources: scanned.resourceDefinitions,
    requests: scanned.requestDefinitions,
    providers: scanned.providerDefinitions,
    services: scanned.serviceDefinitions,
    responses: scanned.responseDefinitions,
  };
  const completeLaravelSourceModelBuildResult = buildCompleteLaravelSourceModel(
    completeAst,
    sourceProject,
    seeds,
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
