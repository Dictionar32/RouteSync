import { controllerInvocationManifestCompositionInputFactory } from '../parsers/php/controllerInvocationManifestCompositionInterface'
import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { manifestGeneratorOperations } from '../generators/ManifestGenerator'
import { manifestContractValidationOperations } from '../generators/ManifestContractValidator'
import { createLaravelSourceProjectIdentity, sourceFileIdentityFactory, sourceFileInventoryFactory, laravelRouteSourceSelectionAuthority, routeSyncManifestFlowProjection, routeSyncManifestDataflowProjection, routeSyncManifestGraphProjection, routeManifestProjectionCompositionFactory, routeManifestRequestResolutionPreflight, IRNodeRegistry, routeSyncManifestDataflowAnalysisOperations, semanticDataflowIRProjection, serviceGraphBuilderFactory, stringValue } from '@routesync/core'
import { cliSemanticDataflowRuntimeBoundary } from '../dataflow/semanticDataflowRuntimeBoundary'
import type { RouteSyncCliUpstreamCompositionInterface } from '../upstreamCompositionInterface'
import type { RouteSyncCliManifestScanOperationInterface } from '../manifestScanOperationInterface'

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
      const manifestScanOperation: RouteSyncCliManifestScanOperationInterface = composition.manifestScanOperation
      // Validate the complete upstream authority bundle before canonicalizing project identity or selecting source files.
      const sourceProject = createLaravelSourceProjectIdentity.create(sourceFileIdentityFactory.create(stringValue.create(targetDir)))
      const selectedRouteFile = path.resolve(targetDir, options.input)
      const routeSourceSelection = laravelRouteSourceSelectionAuthority.explicitFiles(sourceFileInventoryFactory.empty().include(sourceFileIdentityFactory.create(stringValue.create(selectedRouteFile))))
      const scannedManifest = await manifestScanOperation.scan(controllerInvocationManifestCompositionInputFactory.create(
        sourceProject,
        laravelRouteSourceSelectionAuthority.explicitIntent(routeSourceSelection),
      ))
      const completeManifest = scannedManifest.requireCompleteManifest()
      const manifestFlow = routeSyncManifestFlowProjection.project(completeManifest)
      // Preserve the upstream invocation judgment and exact integrated-response ADT at the CLI boundary.
      require('fs').writeFileSync(path.resolve(path.dirname(outputPath), 'routesync.invocations.json'), JSON.stringify(manifestFlow.invocationSemanticJudgments, null, 2))
      const dataflowSurface = routeSyncManifestDataflowProjection.project(manifestFlow)
      const graphSurface = routeSyncManifestGraphProjection.project(manifestFlow)
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
      const resolvedManifest = routeManifestProjection.continue({
        manifest_projected: (outcome) => outcome.manifest,
        manifest_projection_blocked: (outcome) => {
          spinner.fail(chalk.red(`Scan blocked by upstream RequestType semantic judgment: ${JSON.stringify(outcome.derivation)}`))
          process.exit(1)
        },
      })
      const routes = resolvedManifest.routes
      const models = resolvedManifest.models
      const resources = resolvedManifest.resources
      const irRegistry = new IRNodeRegistry()

      manifestContractValidationOperations.validate(resolvedManifest).continueWith({
        onValidated: () => undefined,
        onRejected: judgment => {
          spinner.fail(chalk.red(`Scan blocked by manifest contract validation: ${JSON.stringify(judgment.violations)}`))
          process.exit(1)
        },
      })
      const persistenceJudgment = await manifestGeneratorOperations.save(resolvedManifest, outputPath)
      const persistenceContinues = persistenceJudgment.continueWith({
        onComplete: () => true,
        onContractRejected: judgment => {
          spinner.fail(chalk.red(`Scan blocked by manifest contract validation: ${JSON.stringify(judgment.violations)}`))
          process.exitCode = 1
          return false
        },
        onSerializationRejected: judgment => {
          spinner.fail(chalk.red(`Scan blocked by manifest serialization: ${judgment.message}`))
          process.exitCode = 1
          return false
        },
        onWriteRejected: judgment => {
          spinner.fail(chalk.red(`Scan blocked while writing manifest ${judgment.outputPath}: ${judgment.message}`))
          process.exitCode = 1
          return false
        },
      })
      if (!persistenceContinues) return
      const fs = require('fs')
      const graphBuilder = serviceGraphBuilderFactory.createBuilder()
      const serviceGraph = graphBuilder.project(graphSurface)
      fs.writeFileSync(path.resolve(path.dirname(outputPath), 'routesync.graph.json'), JSON.stringify(serviceGraph, null, 2))
      const dataflowAnalysis = routeSyncManifestDataflowAnalysisOperations.analyze(dataflowSurface, cliSemanticDataflowRuntimeBoundary)
      fs.writeFileSync(path.resolve(path.dirname(outputPath), 'routesync.dataflow.json'), JSON.stringify(dataflowAnalysis, null, 2))
      const dataflowIR = dataflowAnalysis.map(result => semanticDataflowIRProjection.project(result.analysis.interface))
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
