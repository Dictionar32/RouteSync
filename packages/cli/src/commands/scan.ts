import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { ManifestGenerator } from '../generators/ManifestGenerator'
import { validateManifestContract } from '../generators/ManifestContractValidator'
import { createLaravelSourceProjectIdentity, createSourceFile, laravelRouteSourceSelectionAuthority, routeSyncManifestFlowProjection, routeSyncManifestDataflowSurfaceFromFlow, routeSyncManifestGraphSurfaceFromFlow, routeManifestProjectionCompositionFactory, routeManifestRequestResolutionPreflight, IRNodeRegistry, analyzeRouteSyncManifestDataflow, projectSemanticDataflowToIR, createServiceGraphBuilder } from '@routesync/core'
import { cliSemanticDataflowRuntimeBoundary } from '../dataflow/semanticDataflowRuntimeBoundary'
import type { RouteSyncCliUpstreamCompositionInterface } from '../upstreamCompositionInterface'

export interface ScanCommandFactoryInterface {
  readonly create: (composition: RouteSyncCliUpstreamCompositionInterface) => Command;
}

export const createScanCommand: ScanCommandFactoryInterface = Object.freeze({
  create: (composition: RouteSyncCliUpstreamCompositionInterface) => new Command('scan')
  .description('Scan Laravel/PHP routes and output a route manifest')
  .argument('[projectDir]', 'Path to Laravel project root')
  .option('-i, --input <path>', 'Path to routes/api.php (relative to projectDir or absolute)', 'routes/api.php')
  .option('-o, --output <path>', 'Output manifest path', 'routesync.manifest.json')
  .option('-b, --baseURL <url>', 'API base URL', 'http://localhost/api')
  .option('--models', 'Extract Database Schema via Eloquent Models')
  .action(async (projectDir, options) => {
    const spinner = ora('Scanning routes...').start()

    const path = require('path')
    const targetDir = projectDir ? path.resolve(process.cwd(), projectDir) : process.cwd()
    const outputPath = path.isAbsolute(options.output) ? options.output : path.resolve(targetDir, options.output)

    try {
      // The composition root already assembled and validated the canonical upstream pipeline.
      // Commands consume that exact pipeline; they must not run a second semantic-resolution path.
      const requestTypeDerivationPipeline = composition.requestTypeDerivationPipeline
      const manifestScanOperation = composition.manifestScanOperation
      // Validate the complete upstream authority bundle before canonicalizing project identity or selecting source files.
      const sourceProject = createLaravelSourceProjectIdentity(targetDir)
      const selectedRouteFile = path.resolve(targetDir, options.input)
      const routeSourceSelection = laravelRouteSourceSelectionAuthority.explicitFiles([createSourceFile(selectedRouteFile)])
      const scannedManifest = await manifestScanOperation.scan(Object.freeze({
        kind: 'controller_invocation_manifest_composition_input',
        sourceProject,
        routeSelection: Object.freeze({ kind: 'laravel_route_source_selection_explicit', selection: routeSourceSelection }),
      }))
      if (scannedManifest.kind === 'controller_invocation_manifest_source_project_identity_blocked') {
        spinner.fail(chalk.red(`Scan blocked: project-root identity could not be canonicalized: ${scannedManifest.identity.requested.root.value.value}`))
        process.exit(1)
      }
      if (scannedManifest.kind === 'controller_invocation_manifest_source_document_identity_rejected') {
        spinner.fail(chalk.red(`Scan blocked by source-document identity binding: ${JSON.stringify(scannedManifest.rejections)}`))
        process.exit(1)
      }
      if (scannedManifest.kind === 'controller_invocation_manifest_source_documents_blocked') {
        const blockedSources = scannedManifest.blockedReads.map(read => read.blocker.kind + ': ' + read.sourceFile.value.value);
        console.error('Controller source document acquisition blocked:', blockedSources.join(', '));
        process.exitCode = 1;
        return;
      }
      if (scannedManifest.kind === 'controller_invocation_manifest_source_discovery_blocked') {
        spinner.fail(chalk.red(`Scan blocked by controller-source discovery: ${JSON.stringify(scannedManifest.discovery.blocker)}`))
        process.exit(1)
      }
      if (scannedManifest.kind === 'controller_invocation_manifest_inventory_rejected') {
        spinner.fail(chalk.red(`Scan blocked by controller-inventory judgment: ${JSON.stringify(scannedManifest.inventory.rejections)}`))
        process.exit(1)
      }
      if (scannedManifest.kind === 'manifest_builder_blocked') {
        spinner.fail(chalk.red(`Scan blocked by upstream manifest judgment: ${JSON.stringify(scannedManifest)}`))
        process.exit(1)
      }
      const completeManifest = scannedManifest.manifest
      const manifestFlow = routeSyncManifestFlowProjection.project(completeManifest)
      // Preserve the upstream invocation judgment and exact integrated-response ADT at the CLI boundary.
      require('fs').writeFileSync(path.resolve(path.dirname(outputPath), 'routesync.invocations.json'), JSON.stringify(manifestFlow.invocationSemanticJudgments, null, 2))
      const dataflowSurface = routeSyncManifestDataflowSurfaceFromFlow(manifestFlow)
      const graphSurface = routeSyncManifestGraphSurfaceFromFlow(manifestFlow)
      // Resolve source bindings before invoking the authority-backed semantic projection. No legacy RequestType[] fallback is permitted.
      const requestResolutionPreflight = routeManifestRequestResolutionPreflight.evaluate(completeManifest)
      require('fs').writeFileSync(path.resolve(path.dirname(outputPath), 'routesync.request-type-source-evidence.json'), JSON.stringify(requestResolutionPreflight.sourceEvidence, null, 2))
      require('fs').writeFileSync(path.resolve(path.dirname(outputPath), 'routesync.request-type-resolution.json'), JSON.stringify(requestResolutionPreflight.assessment, null, 2))
      require('fs').writeFileSync(path.resolve(path.dirname(outputPath), 'routesync.resource-resolution.json'), JSON.stringify(requestResolutionPreflight.resourceAssessment, null, 2))
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
          spinner.fail(chalk.red(`Scan blocked by upstream RequestType semantic judgment: ${JSON.stringify(routeManifestProjection.derivation)}`))
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
      const irRegistry = new IRNodeRegistry()

      validateManifestContract(resolvedManifest)
      await ManifestGenerator.save(resolvedManifest, outputPath)
      const fs = require('fs')
      const graphBuilder = createServiceGraphBuilder()
      const serviceGraph = graphBuilder.project(graphSurface)
      fs.writeFileSync(path.resolve(path.dirname(outputPath), 'routesync.graph.json'), JSON.stringify(serviceGraph, null, 2))
      const dataflowAnalysis = analyzeRouteSyncManifestDataflow(dataflowSurface, cliSemanticDataflowRuntimeBoundary)
      fs.writeFileSync(path.resolve(path.dirname(outputPath), 'routesync.dataflow.json'), JSON.stringify(dataflowAnalysis, null, 2))
      const dataflowIR = dataflowAnalysis.map(result => projectSemanticDataflowToIR(result.analysis.interface))
      fs.writeFileSync(path.resolve(path.dirname(outputPath), 'routesync.dataflow.ir.json'), JSON.stringify(dataflowIR, null, 2))

      // Stage 2 (IR v3) output — additive, does not change manifest/graph output above.
      // Addressable SemanticIRNodes for stages 3-6 (CompilerRoadmap.md) to key off.
      fs.writeFileSync(
        path.resolve(path.dirname(outputPath), 'routesync.ir.json'),
        JSON.stringify({ irVersion: 'ir.v2', nodeCount: irRegistry.size, nodes: irRegistry.toJSON() }, null, 2)
      )

      spinner.succeed(
        chalk.green(`Found ${routes.length} routes, ${models?.length || 0} models, ${resources?.length || 0} resources → ${outputPath}`)
      )

      routes.forEach((r) => {
        const routeStr = `  ${chalk.cyan(r.identity.coordinates.method.padEnd(7))} ${chalk.white(r.identity.coordinates.path)} ${r.capability.auth.value ? chalk.yellow('[auth]') : ''}`
        console.log(routeStr)
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      spinner.fail(chalk.red(`Scan failed: ${msg}`))
      process.exit(1)
    }
  }),
});
