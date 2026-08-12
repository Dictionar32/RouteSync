import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { LaravelRouteParser } from '../parsers/LaravelRouteParser'
import { ManifestGenerator } from '../generators/ManifestGenerator'
import { ScannedModel } from '../utils/incremental'
import { RouteManifest } from '@routesync/core'

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
    const inputPath = path.isAbsolute(options.input) ? options.input : path.resolve(targetDir, options.input)
    const outputPath = path.isAbsolute(options.output) ? options.output : path.resolve(targetDir, options.output)

    try {
      const parser = new LaravelRouteParser()
      const { routes, models, resources } = await parser.parse(inputPath, { extractModels: !!options.models })

      const manifest = ManifestGenerator.generate(routes, options.baseURL)
      if (options.models) {
        manifest.models = models
        manifest.resources = resources
      }
      
      const { SemanticKernelV2Impl } = await import('@routesync/core')
      const kernel = new SemanticKernelV2Impl()

      const graphModels: Record<string, unknown> = {}
      if (models) {
        models.forEach((m) => {
          const fields: Record<string, unknown> = {}
          if (m.columns) {
            m.columns.forEach((col) => {
              const baseType = kernel.mapSqlTypeToTs(col.type)
              let castedType = baseType
              if (m.casts && m.casts[col.name]) {
                castedType = kernel.mapCastToTs(m.casts[col.name], baseType)
              }
              fields[col.name] = { type: castedType, nullable: !!col.nullable }
            })
          }
          graphModels[m.name] = {
            kind: 'model_node',
            name: m.name,
            table: m.table,
            fields: fields,
            relations: m.relations,
            accessors: m.accessors,
            // casts wajib dibawa: ModelColumnResolver membaca cast via
            // SymbolTable.cast() — tanpa ini kolom ber-cast (mis. `detail`
            // => 'array') jatuh ke string, dan property access JSON
            // ($detail['gateway']) tidak pernah jadi 'json-object' sehingga
            // seluruh rantai ternary di resource tidak ter-resolve.
            casts: m.casts,
            layer: 'model',
            confidence: 1.0
          }
        })
      }

      kernel.loadGraph({
        services: {},
        controllers: {},
        models: graphModels,
        edges: []
      })
      
      const { resolveManifestIncrementally } = await import('../utils/incremental')
      const { manifest: resolvedManifest, irRegistry } = resolveManifestIncrementally(manifest, outputPath, kernel, models as ScannedModel[] | undefined)

      await ManifestGenerator.save(resolvedManifest, outputPath)
      const fs = require('fs')
      const { ServiceGraphBuilder } = await import('@routesync/core')
      const graphBuilder = new ServiceGraphBuilder()
      const serviceGraph = graphBuilder.buildFromManifest(resolvedManifest as unknown as RouteManifest)
      fs.writeFileSync(path.resolve(path.dirname(outputPath), 'routesync.graph.json'), JSON.stringify(serviceGraph, null, 2))

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
        const routeStr = `  ${chalk.cyan(r.method.padEnd(7))} ${chalk.white(r.path)} ${r.auth ? chalk.yellow('[auth]') : ''}`
        
        if (!r.response) {
          console.log(routeStr)
          console.log(chalk.yellow(`    [RouteSync Warning] Response type could not be inferred.`))
          console.log(chalk.yellow(`    Use: #[Response(...)] or return a JsonResource.`))
        } else {
          console.log(routeStr)
        }
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      spinner.fail(chalk.red(`Scan failed: ${msg}`))
      process.exit(1)
    }
  })
