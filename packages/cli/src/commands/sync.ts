import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { ManifestGenerator } from '../generators/ManifestGenerator'
import { SDKGenerator } from '../generators/SDKGenerator'
import { TypeGenerator } from '../generators/TypeGenerator'
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
import { ScannedModel } from '../utils/incremental'
import { StaticLaravelScanner } from '@routesync/core'

import fs from 'fs-extra'

export const syncCommand = new Command('sync')
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
      // Step 1: Scan via StaticLaravelScanner (0 PHP subprocess)
      const targetDir = process.cwd()
      const manifest: any = await StaticLaravelScanner.scan(targetDir, {
        baseURL: options.baseURL,
        version: '6.0.0'
      })
      const routes = (manifest.routes || []) as any[]
      const models = (manifest.models || []) as any[]
      const resources = (manifest.resources || []) as any[]
      const channels = (manifest.channels || []) as any[]

      // Semantic Kernel V2 resolution
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
      
      const pathModule = require('path')
      const localManifestPath = pathModule.resolve(process.cwd(), 'routesync.manifest.json')

      const { resolveManifestIncrementally } = await import('../utils/incremental')
      const { manifest: resolvedManifest, irRegistry } = resolveManifestIncrementally(manifest, localManifestPath, kernel, models as ScannedModel[] | undefined)

      // Save the resolved manifest locally
      await ManifestGenerator.save(resolvedManifest, localManifestPath)

      // Stage 2 (IR v3) output — additive, does not change any generator input above.
      await fs.writeJson(
        pathModule.resolve(pathModule.dirname(localManifestPath), 'routesync.ir.json'),
        { irVersion: 'ir.v2', nodeCount: irRegistry.size, nodes: irRegistry.toJSON() },
        { spaces: 2 }
      )

      spinner.succeed(chalk.green(`✔ ${steps[0].text} (${routes.length} routes, ${channels.length} channels, ${models ? models.length : 0} models)`))

      await fs.ensureDir(options.output)

      // Step 2: Types
      spinner.start(steps[1].text)
      await TypeGenerator.generate(resolvedManifest, options.output)
      
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
  })
