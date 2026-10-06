import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { ManifestGenerator } from '../generators/ManifestGenerator'
import { validateManifestContract } from '../generators/ManifestContractValidator'
import { manifestBuilder, createLaravelSourceProjectIdentity, routeSyncManifestFlowFromManifest, routeSyncManifestDataflowSurfaceFromFlow, routeSyncManifestGraphSurfaceFromFlow, lowerRouteSyncManifestToRouteManifest, projectRouteSyncManifestForRouteManifest, IRNodeRegistry, analyzeRouteSyncManifestDataflow, projectSemanticDataflowToIR, createServiceGraphBuilder } from '@routesync/core'
import { cliSemanticDataflowRuntimeBoundary } from '../dataflow/semanticDataflowRuntimeBoundary'

export const scanCommand = new Command('scan')
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
      const sourceProject = createLaravelSourceProjectIdentity(targetDir)
      const scannedManifest = await manifestBuilder.build(sourceProject)
      const manifestFlow = routeSyncManifestFlowFromManifest(scannedManifest)
      const dataflowSurface = routeSyncManifestDataflowSurfaceFromFlow(manifestFlow)
      const graphSurface = routeSyncManifestGraphSurfaceFromFlow(manifestFlow)
      const routeManifestProjection = projectRouteSyncManifestForRouteManifest(scannedManifest)
      const resolvedManifest = lowerRouteSyncManifestToRouteManifest(
        scannedManifest,
        options.baseURL,
        '6.0.0',
        routeManifestProjection,
      )
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
  })
