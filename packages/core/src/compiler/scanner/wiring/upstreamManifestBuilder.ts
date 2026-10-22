import { laravelSourceAstPipelineFactory } from './laravelSourceAstPipeline';
import { laravelSourceAstPipelineDependencies } from './laravelSourceAstPipelineDependencies';
import { semanticDataflowManifestSurface } from '../../../types/upstream/semanticDataflowManifestSurface';
import { resourceGroupCapabilityAuthority } from '../../../types/upstream/resourceGroupCapability';
import type { LaravelSourceAstPipelineInterface } from '../../../types/upstream/laravelSourceAstPipelineInterface';
import { completeLaravelSourceModelBuilder, type SemanticContractSeeds, type SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { NumberValue } from '../../../types/upstream/valueObjects';
import type { SemanticDataflowManifestSurfaceInterface } from '../../../types/upstream/semanticDataflowManifestSurface';
import type { ResourceGroupCapabilityAlgebraInterface } from '../../../types/upstream/resourceGroupCapability';
import type { CompleteLaravelSourceModelBuilderInterface } from '../../../types/upstream/highLevelSourceModel';
import type { ManifestBuilderInput, ManifestBuilderInterface, ManifestBuilderJudgment, ManifestBuilderOperationPreparationInterface } from '../../../types/upstream/manifestBuilderInterface';

const manifestVersion = Object.freeze({
  kind: 'manifest_version' as const,
  major: Object.freeze({ kind: 'number_value', value: 6 }) satisfies NumberValue,
  minor: Object.freeze({ kind: 'number_value', value: 0 }) satisfies NumberValue,
  patch: Object.freeze({ kind: 'number_value', value: 0 }) satisfies NumberValue,
});

/**
 * Prepare one explicit manifest-build operation. The operation stores its input
 * as typed data. The executor closes over this explicit operation input and its
 * dependencies, so calling `build` detached from its object cannot lose its receiver.
 */
/** Fully typed upstream preparation authority: implementation lives on the runtime interface object. */
export const manifestBuilderOperationPreparation: ManifestBuilderOperationPreparationInterface = Object.freeze({
  kind: 'manifest_builder_operation_preparation',
  contractVersion: 1,
  prepare: (input: ManifestBuilderInput): ManifestBuilderInterface => {
  const invocationInventoryReceipt = input.invocationInventoryReceipt;
  const pipelineInput = Object.freeze({
    kind: 'laravel_source_ast_pipeline_execution_input' as const,
    invocationInventoryReceipt,
    routeSelection: input.routeSelection,
  });
  const sourceAstPipeline = laravelSourceAstPipelineFactory.create(laravelSourceAstPipelineDependencies, pipelineInput);
  const dataflowManifestSurface = semanticDataflowManifestSurface satisfies SemanticDataflowManifestSurfaceInterface;
  const resourceGroupCapabilitiesAlgebra = resourceGroupCapabilityAuthority satisfies ResourceGroupCapabilityAlgebraInterface;
  const sourceModelBuilder = completeLaravelSourceModelBuilder satisfies CompleteLaravelSourceModelBuilderInterface;
  return Object.freeze({
    kind: 'manifest_builder',
    closed: true,
    contractVersion: 8,
    input,
    sourceAstPipeline: sourceAstPipeline satisfies LaravelSourceAstPipelineInterface,
    dataflowManifestSurface,
    resourceGroupCapabilityAlgebra: resourceGroupCapabilitiesAlgebra,
    sourceModelBuilder,
    async build(): Promise<ManifestBuilderJudgment> {
      const invocationInventoryReceipt = input.invocationInventoryReceipt;
      const sourceProject: SourceProjectIdentity = invocationInventoryReceipt.sourceInventory.sourceProject;
      const projection = await sourceAstPipeline.execute();
      if (projection.kind !== 'laravel_source_ast_projection_complete') {
        return Object.freeze({
          kind: 'manifest_builder_blocked',
          stage: 'source_ast',
          sourceProject,
          projection,
        });
      }
      const completeAst = projection.completion;
      const scanned = completeAst.ast;
      const seeds: SemanticContractSeeds = {
        models: scanned.modelDefinitions,
        resources: scanned.resourceDefinitions,
        requests: scanned.requestDefinitions,
        providers: scanned.providerDefinitions,
        services: scanned.serviceDefinitions,
        responses: scanned.responseDefinitions,
      };
      const completeLaravelSourceModelBuildResult = sourceModelBuilder.build(Object.freeze({
        kind: 'complete_laravel_source_model_build_input',
        ast: completeAst,
        identity: sourceProject,
        seeds,
      }));
      if (completeLaravelSourceModelBuildResult.kind === 'source_model_build_blocked') {
        return Object.freeze({
          kind: 'manifest_builder_blocked',
          stage: 'source_model',
          sourceProject,
          sourceModel: completeLaravelSourceModelBuildResult,
        });
      }

      const dataflowInputs = dataflowManifestSurface.inputsFromSourceModel(completeLaravelSourceModelBuildResult.value);
      const dataflowJudgments = dataflowManifestSurface.judgmentsFromInputs(dataflowInputs);
      const dataflowQueryPolicyContracts = dataflowManifestSurface.queryPolicyContractsFromJudgments(
        dataflowJudgments,
        sourceProject.dataflowQueryPolicyIntent,
      );

      return Object.freeze({
        kind: 'manifest_builder_complete',
        manifest: Object.freeze({
          kind: 'route_sync_manifest' as const,
          version: manifestVersion,
          source: {
            kind: 'laravel_application' as const,
            root: sourceProject.root,
            source: sourceProject.source,
          },
          ast: completeAst,
          sourceModel: completeLaravelSourceModelBuildResult.value,
          dataflowInputs,
          dataflowJudgments,
          dataflowQueryPolicyContracts,
          resourceGroupCapabilities: resourceGroupCapabilitiesAlgebra.compose(completeAst.ast.routeFlows),
          invocationSemanticJudgments: invocationInventoryReceipt.correspondences,
        }),
      });
    },
  });

  },
});
