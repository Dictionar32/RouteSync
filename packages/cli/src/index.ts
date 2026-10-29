#!/usr/bin/env node
import { Command } from 'commander';
import {
  routeSyncStandaloneCompositionLoader,
  routeSyncStandaloneCompositionModuleSourceFactory,
  ROUTESYNC_UPSTREAM_COMPOSITION_MODULE,
} from './standaloneCompositionLoader';
import { createScanCommand } from './commands/scan';
import { generateCommand } from './commands/generate';
import { createSyncCommand } from './commands/sync';
import { watchCommand } from './commands/watch';
import { annotateCommand } from './commands/annotate';
import { explainCommand } from './commands/explain';
import { auditCommand } from './commands/audit';
import type { RequestTypeDerivationSemanticPipelineCompositionInterface } from '@routesync/core';
import { controllerInvocationManifestCompositionAuthority } from './parsers/php/controllerInvocationManifestComposition';
import { routeSyncCliUpstreamCompositionFactory } from './upstreamCompositionFactory';
import type { RouteSyncCliUpstreamCompositionInterface } from './upstreamCompositionInterface';
import type { RouteSyncCliUpstreamCompositionResolution } from './upstreamCompositionFactory';

/**
 * Explicit CLI composition root. A host that owns the upstream semantic
 * composition can inject the assembled pipeline into both source-consuming
 * commands; commands do not construct or infer semantic authority themselves.
 */
export interface RouteSyncCliProgramInterface {
  readonly create: (composition: RouteSyncCliUpstreamCompositionInterface) => Command;
}

export const routeSyncCliProgram: RouteSyncCliProgramInterface = Object.freeze({
  create: (composition: RouteSyncCliUpstreamCompositionInterface): Command => {
    const program: Command = new Command();
    program
      .name('routesync')
      .description('Laravel routes to typed frontend SDKs')
      .version('1.0.0');

    program.addCommand(createScanCommand.create(composition));
    program.addCommand(generateCommand);
    program.addCommand(createSyncCommand.create(composition));
    program.addCommand(watchCommand);
    program.addCommand(annotateCommand);
    program.addCommand(explainCommand);
    program.addCommand(auditCommand);
    return program;
  },
});

/**
 * Production composition entrypoint for hosts that own the semantic capability
 * bundle. The canonical manifest authority is bound here rather than requiring
 * each host to reconstruct the CLI's manifest side of the composition.
 * Semantic reasoning/verifier/decision/authority remain explicit inputs; this
 * operation never manufactures them or falls back to the legacy RequestType[] solver.
 */
export interface RouteSyncCliProgramFactoryInterface {
  readonly createFromSemanticComposition: (
    semanticComposition: RequestTypeDerivationSemanticPipelineCompositionInterface,
  ) => RouteSyncCliProgramResolution;
}

export type RouteSyncCliProgramResolution =
  | Readonly<{
      readonly kind: 'routesync_cli_program_available';
      readonly composition: RouteSyncCliUpstreamCompositionInterface;
      readonly program: Command;
    }>
  | Extract<
      RouteSyncCliUpstreamCompositionResolution,
      { readonly kind: 'routesync_cli_upstream_semantic_assembly_rejected' }
    >;


export const routeSyncCliProgramFactory: RouteSyncCliProgramFactoryInterface = Object.freeze({
  createFromSemanticComposition: (
    semanticComposition: RequestTypeDerivationSemanticPipelineCompositionInterface,
  ): RouteSyncCliProgramResolution => {
    const resolution = routeSyncCliUpstreamCompositionFactory.compose(
      controllerInvocationManifestCompositionAuthority,
      semanticComposition,
    );
    return resolution.continueForCliComposition({
      compositionAvailable: (composition: RouteSyncCliUpstreamCompositionInterface): RouteSyncCliProgramResolution => Object.freeze({
        kind: 'routesync_cli_program_available',
        composition,
        program: routeSyncCliProgram.create(composition),
      }),
      semanticAssemblyRejected: (): RouteSyncCliProgramResolution => resolution as Extract<RouteSyncCliProgramResolution, { readonly kind: 'routesync_cli_upstream_semantic_assembly_rejected' }>,
    });
  },
});

// The executable requires an explicitly configured host-owned semantic
// composition. Missing or invalid capabilities fail at the CLI boundary; the
// executable never substitutes a diagnostic composition or legacy inference.
const isCliEntry = Boolean(
  process.argv[1] &&
  (process.argv[1].endsWith('/cli.js') ||
   process.argv[1].endsWith('/routesync') ||
   process.argv[1].endsWith('/cli'))
);

export interface RouteSyncStandaloneCliOperationInterface {
  readonly run: () => Promise<void>;
}

export const routeSyncStandaloneCliOperation: RouteSyncStandaloneCliOperationInterface = Object.freeze({
  run: async (): Promise<void> => {
  try {
    const loaded = await routeSyncStandaloneCompositionLoader.load(routeSyncStandaloneCompositionModuleSourceFactory.fromEnvironment(process.env));
    switch (loaded.kind) {
      case 'composition_module_missing':
        console.error(`RouteSync CLI is fail-closed: set ${loaded.environmentVariable} to an absolute or working-directory-relative JavaScript module exporting requestTypeDerivationSemanticComposition. The module must provide executable preparation, reasoning, complete verifier, decision, authority (including complete decision-rule coverage), and integrity capabilities. See examples/upstream-composition for the interface-first host template.`);
        process.exitCode = 1;
        return;
      case 'composition_module_invalid':
        console.error(`RouteSync CLI composition module is invalid (${loaded.reason}): ${loaded.modulePath}`);
        process.exitCode = 1;
        return;
      case 'composition_module_import_failed':
        console.error(`RouteSync CLI could not import composition module ${loaded.modulePath}: ${loaded.message}`);
        process.exitCode = 1;
        return;
      case 'composition_module_loaded': {
        const programResolution = routeSyncCliProgramFactory.createFromSemanticComposition(loaded.composition);
        switch (programResolution.kind) {
          case 'routesync_cli_upstream_semantic_assembly_rejected':
            console.error('RouteSync CLI composition rejected: semantic capabilities do not share the canonical upstream contract.');
            process.exitCode = 1;
            return;
          case 'routesync_cli_program_available':
            await programResolution.program.parseAsync(process.argv);
            return;
          default: {
            const exhaustive: never = programResolution;
            exhaustive;
          }
        }
      }
      default:
        return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown composition loading failure';
    console.error(`RouteSync CLI failed: ${message}`);
    process.exitCode = 1;
  }
  },
});

if (isCliEntry) {
  void routeSyncStandaloneCliOperation.run();
}

// Public manifest runtime API: expose canonical operation values and their ADT contracts.
export {
  manifestContractValidationOperations,
  manifestSerializationOperations,
  manifestGeneratorOperations,
  manifestCodeGenerationOperation,
  ManifestCodeGenerationBlockedError,
} from './generators';
export type {
  ManifestContractViolation,
  ManifestContractValidatedJudgment,
  ManifestContractRejectedJudgment,
  ManifestContractValidationJudgment,
  ManifestContractValidationOperationsInterface,
  SerializableManifestRoute,
  SerializableManifestContract,
  SerializableManifest,
  ManifestSerializationJudgment,
  ManifestSerializationCompleteJudgment,
  ManifestSerializationRejectedJudgment,
  ManifestSerializationOperationsInterface,
  ManifestGeneratorOptions,
  ManifestGenerationJudgment,
  ManifestGenerationCompleteJudgment,
  ManifestGenerationRejectedJudgment,
  ManifestPersistenceJudgment,
  ManifestPersistenceCompleteJudgment,
  ManifestPersistenceContractRejectedJudgment,
  ManifestPersistenceSerializationRejectedJudgment,
  ManifestPersistenceWriteRejectedJudgment,
  ManifestGeneratorOperationsInterface,
  ManifestCodeGenerationInput,
  ManifestCodeGenerationBlockedOutcome,
  ManifestCodeGenerationOperationInterface,
} from './generators';
export {
  ManifestContractValidationBlockedError,
  ManifestSerializationBlockedError,
  ManifestGenerationBlockedError,
  ManifestPersistenceBlockedError,
} from './generators';

export type { RouteSyncCliUpstreamCompositionInterface } from './upstreamCompositionInterface';
export type { RouteSyncCliManifestScanOperationInterface } from './manifestScanOperationInterface';
export { phpAstBoundaryOperations } from './parsers/php/astBoundarySemanticInterface';
export type { PhpAstBoundaryOperationsInterface, PhpAstBoundaryJudgment, PhpAstBoundaryJudgmentHandlers, PhpAstBoundaryFact, PhpAstBoundaryRelation } from './parsers/php/astBoundarySemanticInterface';
export { controllerInvocationManifestBuilder, controllerInvocationManifestTerminalOperationsFactory, controllerInvocationManifestCompositionAuthorityFactory, controllerInvocationManifestCompositionAuthority } from './parsers/php/controllerInvocationManifestComposition';
export type {
  ControllerInvocationManifestBuilderInterface,
  ControllerInvocationManifestCompositionInput,
  ControllerInvocationManifestCompositionAuthorityInterface,
  ControllerInvocationManifestCompositionDependencies,
  ControllerInvocationManifestCompositionAuthorityFactoryInterface,
  ControllerInvocationManifestTerminalOperationInterface,
  ControllerInvocationManifestTerminalFailure,
  ControllerInvocationManifestTerminalFailureEvidence,
  ControllerInvocationManifestTerminalOperationsFactoryInterface,
  ControllerInvocationManifest,
  ControllerInvocationManifestCompleteJudgment,
  ControllerInvocationManifestBlockedJudgment,
  ControllerInvocationManifestInventoryRejectedTerminal,
  ControllerInvocationManifestSourceDiscoveryBlockedTerminal,
  ControllerInvocationManifestSourceProjectIdentityBlockedTerminal,
  ControllerInvocationManifestSourceDocumentsBlockedTerminal,
  ControllerInvocationManifestSourceDocumentIdentityRejectedTerminal,
} from './parsers/php/controllerInvocationManifestCompositionInterface';
export { routeSyncCliManifestScanOperationFactory } from './manifestScanOperationInterface';
export type { RouteSyncCliManifestScanOperationFactoryInterface, RouteSyncCliManifestScanOperationInterface } from './manifestScanOperationInterface';
export type { RouteSyncCliUpstreamCompositionResolution } from './upstreamCompositionFactory';

export {
  resolveManifestIncrementally,
  NominalAtomFactory,
  matchRouteResponsePayload,
  ScannedResourceDescriptor,
  type ScannedResource,
  type ScannedModel,
  type ScannedManifest,
  type ScannedResourceContract,
  type ScannedModelContract,
  type ScannedManifestContract,
  type RouteResponsePayloadContract,
  type RouteResponsePayloadVisitor,
  type KernelResolver,
  type ResolveManifestResult,
  type RouteSemanticFlowMethod,
  type RouteSemanticFlowPath,
  type RouteSemanticFlowName,
  type ScannedStableHash,
  type SourceFilePath,
  type SourceLineNumber
} from './utils/incremental';

export { routeSyncCliUpstreamCompositionFactory } from './upstreamCompositionFactory';
export type { RouteSyncCliUpstreamCompositionFactoryInterface, RouteSyncCliUpstreamCompositionResolution, RouteSyncCliUpstreamCompositionResolutionHandlers } from './upstreamCompositionFactory';

export {
  routeSyncStandaloneCompositionModuleSourceFactory,
} from './standaloneCompositionLoader';
export type {
  RouteSyncStandaloneCompositionModuleSource,
  RouteSyncStandaloneCompositionModuleLocation,
  RouteSyncStandaloneCompositionModuleSourceFactoryInterface,
  RouteSyncStandaloneCompositionLoaderInterface,
  RouteSyncStandaloneCompositionLoadResult,
} from './standaloneCompositionLoader';
