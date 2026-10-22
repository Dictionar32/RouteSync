import { Command } from 'commander'
import path from 'node:path'
import ora from 'ora'
import chalk from 'chalk'
import { ManifestGenerator } from '../generators/ManifestGenerator'
import { SDKGenerator } from '../generators/SDKGenerator'
import { HookGenerator } from '../generators/HookGenerator'
import { ValuesGenerator } from '../generators/ValuesGenerator'
import { NextActionGenerator } from '../generators/NextActionGenerator'
import { MswGenerator } from '../generators/MswGenerator'
import { LaravelChannelParser } from '../parsers/LaravelChannelParser'
import { EchoGenerator } from '../generators/EchoGenerator'
import { IndexGenerator } from '../generators/IndexGenerator'
import { ModelGenerator } from '../generators/ModelGenerator'
import { QueryKeyGenerator } from '../generators/QueryKeyGenerator'
import { ConstantsGenerator } from '../generators/ConstantsGenerator'
import { RoutesGenerator } from '../generators/RoutesGenerator'
import { createLaravelSourceProjectIdentity, createSourceFile, laravelRouteSourceSelectionAuthority, routeSyncManifestFlowProjection, routeSyncManifestDataflowSurfaceFromFlow, routeManifestProjectionCompositionFactory, routeManifestRequestResolutionPreflight, IRNodeRegistry, analyzeRouteSyncManifestDataflow, projectSemanticDataflowToIR } from '@routesync/core'
import { cliSemanticDataflowRuntimeBoundary } from '../dataflow/semanticDataflowRuntimeBoundary'
import type { RouteSyncCliUpstreamCompositionInterface } from '../upstreamCompositionInterface'

import fs from 'fs-extra'

export interface SyncCommandFactoryInterface {
  readonly create: (composition: RouteSyncCliUpstreamCompositionInterface) => Command;
}

export const createSyncCommand: SyncCommandFactoryInterface = Object.freeze({
  create: (composition: RouteSyncCliUpstreamCompositionInterface) => new Command('sync')
  .description('Scan routes and generate SDK in one step')
  .option('-i, --input <path>', 'Path to routes/api.php', 'routes/api.php')
  .option('-o, --output <path>', 'Output directory', 'src/api')
  .option('-b, --baseURL <url>', 'API base URL', 'http://localhost/api')
  .option('--no-hooks', 'Skip generating React hooks')
  .option('--next-actions', 'Generate Next.js Server Actions')
  .option('--msw', 'Generate MSW Mock Handlers')
  .option('--echo', 'Generate Laravel Echo Hooks')
  .option('--models', 'Extract Database Schema via Eloquent Models')
  .option('--zod', 'Generate Zod Schemas for request validation')
  .action(async (options) => {
    console.log(chalk.bold.blue('\n  routesync sync\n'))

    const steps = [
      { text: 'Scanning Laravel routes' },
      { text: 'Generating types' },
      { text: 'Generating SDK' },
      { text: 'Generating hooks' },
      { text: 'Generating Server Actions' }
    ]

    const spinner = ora(steps[0].text).start()

    try {
      // The composition root already assembled and validated the canonical upstream pipeline.
      // Commands consume that exact pipeline; they must not run a second semantic-resolution path.
      const requestTypeDerivationPipeline = composition.requestTypeDerivationPipeline
      const manifestScanOperation = composition.manifestScanOperation
      // Step 1: Build the upstream manifest through its producer interface (0 PHP subprocess).
      // Validate the complete upstream authority bundle before canonicalizing project identity or selecting source files.
      const targetDir = process.cwd()
      const sourceProject = createLaravelSourceProjectIdentity(targetDir)
      const selectedRouteFile = path.resolve(targetDir, options.input)
      const routeSourceSelection = laravelRouteSourceSelectionAuthority.explicitFiles([createSourceFile(selectedRouteFile)])
      const scannedManifest = await manifestScanOperation.scan(Object.freeze({
        kind: 'controller_invocation_manifest_composition_input',
        sourceProject,
        routeSelection: Object.freeze({ kind: 'laravel_route_source_selection_explicit', selection: routeSourceSelection }),
      }))
      if (scannedManifest.kind === 'controller_invocation_manifest_source_project_identity_blocked') {
        spinner.fail(chalk.red(`Sync blocked: project-root identity could not be canonicalized: ${scannedManifest.identity.requested.root.value.value}`))
        process.exit(1)
      }
      if (scannedManifest.kind === 'controller_invocation_manifest_source_document_identity_rejected') {
        spinner.fail(chalk.red(`Sync blocked by source-document identity binding: ${JSON.stringify(scannedManifest.rejections)}`))
        process.exit(1)
      }
      if (scannedManifest.kind === 'controller_invocation_manifest_source_documents_blocked') {
        const blockedSources = scannedManifest.blockedReads.map(read => read.blocker.kind + ': ' + read.sourceFile.value.value);
        console.error('Controller source document acquisition blocked:', blockedSources.join(', '));
        process.exitCode = 1;
        return;
      }
      if (scannedManifest.kind === 'controller_invocation_manifest_source_discovery_blocked') {
        spinner.fail(chalk.red(`Sync blocked by controller-source discovery: ${JSON.stringify(scannedManifest.discovery.blocker)}`))
        process.exit(1)
      }
      if (scannedManifest.kind === 'controller_invocation_manifest_inventory_rejected') {
        spinner.fail(chalk.red(`Sync blocked by controller-inventory judgment: ${JSON.stringify(scannedManifest.inventory.rejections)}`))
        process.exit(1)
      }
      if (scannedManifest.kind === 'manifest_builder_blocked') {
        spinner.fail(chalk.red(`Sync blocked by upstream manifest judgment: ${JSON.stringify(scannedManifest)}`))
        process.exit(1)
      }
      const completeManifest = scannedManifest.manifest
      const manifestFlow = routeSyncManifestFlowProjection.project(completeManifest)
      // Preserve the upstream invocation judgment and exact integrated-response ADT at the CLI boundary.
      await fs.writeJson(path.resolve(process.cwd(), 'routesync.invocations.json'), manifestFlow.invocationSemanticJudgments, { spaces: 2 })
      const dataflowSurface = routeSyncManifestDataflowSurfaceFromFlow(manifestFlow)
      // Resolve source bindings before invoking authority-backed projection; the exact preflight packet is passed downstream.
      const requestResolutionPreflight = routeManifestRequestResolutionPreflight.evaluate(completeManifest)
      await fs.writeJson(path.resolve(process.cwd(), 'routesync.request-type-source-evidence.json'), requestResolutionPreflight.sourceEvidence, { spaces: 2 })
      await fs.writeJson(path.resolve(process.cwd(), 'routesync.request-type-resolution.json'), requestResolutionPreflight.assessment, { spaces: 2 })
      await fs.writeJson(path.resolve(process.cwd(), 'routesync.resource-resolution.json'), requestResolutionPreflight.resourceAssessment, { spaces: 2 })
      // These preflight assessments are diagnostic inventory outputs only. They are not
      // an independent semantic authority and must not short-circuit the canonical
      // proof-producing pipeline. The pipeline's verified judgment is the sole gate
      // for RequestType projection; failures remain explicit in its closed ADT.
      const routeManifestProjection = routeManifestProjectionCompositionFactory.create(requestTypeDerivationPipeline).project(
        requestResolutionPreflight,
        options.baseURL,
        '6.0.0',
      )
      switch (routeManifestProjection.kind) {
        case 'manifest_projected':
          break
        case 'manifest_projection_blocked':
          spinner.fail(chalk.red(`Sync blocked by upstream RequestType semantic judgment: ${JSON.stringify(routeManifestProjection.derivation)}`))
          process.exit(1)
        default: {
          const exhaustive: never = routeManifestProjection
          return exhaustive
        }
      }
      const resolvedManifest = routeManifestProjection.manifest
      const routes = resolvedManifest.routes
      const models = resolvedManifest.models
      const resources = resolvedManifest.resources
      const channels = resolvedManifest.channels
      const localManifestPath = path.resolve(process.cwd(), 'routesync.manifest.json')
      const irRegistry = new IRNodeRegistry()

      // Save the resolved manifest locally
      await ManifestGenerator.save(resolvedManifest, localManifestPath)
      const dataflowAnalysis = analyzeRouteSyncManifestDataflow(dataflowSurface, cliSemanticDataflowRuntimeBoundary)
      await fs.writeJson(
        path.resolve(process.cwd(), 'routesync.dataflow.json'),
        dataflowAnalysis,
        { spaces: 2 }
      )

      const dataflowIR = dataflowAnalysis.map(result => projectSemanticDataflowToIR(result.analysis.interface))
      await fs.writeJson(
        path.resolve(process.cwd(), 'routesync.dataflow.ir.json'),
        dataflowIR,
        { spaces: 2 }
      )

      // Stage 2 (IR v3) output — additive, does not change any generator input above.
      await fs.writeJson(
        path.resolve(path.dirname(localManifestPath), 'routesync.ir.json'),
        { irVersion: 'ir.v2', nodeCount: irRegistry.size, nodes: irRegistry.toJSON() },
        { spaces: 2 }
      )

      spinner.succeed(chalk.green(`✔ ${steps[0].text} (${routes.length} routes, ${channels.length} channels, ${models ? models.length : 0} models)`))

      await fs.ensureDir(options.output)

      spinner.start('Compiling and emitting full contract bundle...')
      const { CompilerBridge } = require('../generators/CompilerBridge')
      const emitted = await CompilerBridge.emitFullBundle(resolvedManifest, options.output, options)
      spinner.succeed(chalk.green(`✔ Emitted ${emitted.allWrittenPaths.length} compiler & client artifacts successfully`))

      console.log(chalk.bold.green('\n  Sync complete!\n'))
      console.log(`  Output: ${chalk.cyan(options.output)}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      spinner.fail(chalk.red(`Sync failed: ${msg}`))
      process.exit(1)
    }
  }),
});
