import { laravelSourceAstPipelineFactory } from './laravelSourceAstPipeline';
import { laravelSourceAstPipelineDependencies } from './laravelSourceAstPipelineDependencies';
import { semanticDataflowManifestSurface } from '../../../types/upstream/semanticDataflowManifestSurface';
import { resourceGroupCapabilityAuthority } from '../../../types/upstream/resourceGroupCapabilityAuthority';
import type { LaravelSourceAstPipelineInterface } from '../../../types/upstream/laravelSourceAstPipelineInterface';
import { completeLaravelSourceModelBuilder, type SemanticContractSeeds, type SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { NumberValue } from '../../../types/upstream/valueObjects';
import type { SemanticDataflowManifestSurfaceInterface } from '../../../types/upstream/semanticDataflowManifestSurface';
import type { ResourceGroupCapabilityAlgebraInterface } from '../../../types/upstream/resourceGroupCapability';
import type { CompleteLaravelSourceModelBuilderInterface } from '../../../types/upstream/highLevelSourceModel';
import { ManifestBuilderBlockedError, type ManifestBuilderInput, type ManifestBuilderInterface, type ManifestBuilderJudgment, type ManifestBuilderBlockedJudgment, type ManifestBuilderCompleteJudgment, type ManifestBuilderOperationPreparationInterface } from '../../../types/upstream/manifestBuilderInterface';

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
    contractVersion: 10,
    input,
    sourceAstPipeline: sourceAstPipeline satisfies LaravelSourceAstPipelineInterface,
    dataflowManifestSurface,
    resourceGroupCapabilityAlgebra: resourceGroupCapabilitiesAlgebra,
    sourceModelBuilder,
    build: async (): Promise<ManifestBuilderJudgment> => {
      const invocationInventoryReceipt = input.invocationInventoryReceipt;
      const sourceProject: SourceProjectIdentity = invocationInventoryReceipt.sourceInventory.sourceProject;
      const projection = await sourceAstPipeline.execute();
      return await projection.continueToManifestBuild({
        onBlocked: blockedProjection => {
          const blockedJudgment: ManifestBuilderBlockedJudgment = Object.freeze({
            kind: 'manifest_builder_blocked',
            stage: 'source_ast',
            blocker: Object.freeze({
              kind: 'manifest_builder_source_ast_blocked',
              sourceProject,
              projection: blockedProjection,
            }),
            requireCompleteManifest: () => { throw new ManifestBuilderBlockedError(blockedJudgment); },
            continueToFlow: () => blockedJudgment,
          });
          return Promise.resolve(blockedJudgment);
        },
        onComplete: async completeProjection => {
          const completeAst = completeProjection.completion;
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
          return await completeLaravelSourceModelBuildResult.continueToManifestBuild({
            onBlocked: async blockedSourceModel => {
              const blockedJudgment: ManifestBuilderBlockedJudgment = Object.freeze({
                kind: 'manifest_builder_blocked',
                stage: 'source_model',
                blocker: Object.freeze({
                  kind: 'manifest_builder_source_model_blocked',
                  sourceProject,
                  sourceModel: blockedSourceModel,
                }),
                requireCompleteManifest: () => { throw new ManifestBuilderBlockedError(blockedJudgment); },
                continueToFlow: () => blockedJudgment,
              });
              return blockedJudgment;
            },
            onComplete: async completeSourceModel => {
              const dataflowInputs = dataflowManifestSurface.inputsFromSourceModel(completeSourceModel.value);
              const dataflowJudgments = dataflowManifestSurface.judgmentsFromInputs(dataflowInputs);
              const dataflowQueryPolicyContracts = dataflowManifestSurface.queryPolicyContractsFromJudgments(
                dataflowJudgments,
                sourceProject.queryPolicySelection,
              );

              const completeJudgment: ManifestBuilderCompleteJudgment = Object.freeze({
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
                  sourceModel: completeSourceModel.value,
                  dataflowInputs,
                  dataflowJudgments,
                  dataflowQueryPolicyContracts,
                  resourceGroupCapabilities: resourceGroupCapabilitiesAlgebra.compose(completeAst.ast.routeFlows),
                  invocationSemanticJudgments: invocationInventoryReceipt.correspondences,
                }),
                requireCompleteManifest: () => completeJudgment.manifest,
                continueToFlow: (projection) => Object.freeze({
                  kind: 'route_sync_manifest_flow_complete' as const,
                  flow: projection.project(completeJudgment.manifest),
                }),
              });
              return completeJudgment;
            },
          });
        },
      });
    },
  });

  },
});
