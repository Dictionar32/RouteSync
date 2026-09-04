import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { SDKGenerator } from '../generators/SDKGenerator'
import { TypeGenerator } from '../generators/TypeGenerator'
import { HookGenerator } from '../generators/HookGenerator'
import { NextActionGenerator } from '../generators/NextActionGenerator'
import { MswGenerator } from '../generators/MswGenerator'
import { EchoGenerator } from '../generators/EchoGenerator'
import { IndexGenerator } from '../generators/IndexGenerator'
import { QueryKeyGenerator } from '../generators/QueryKeyGenerator'
import { ConstantsGenerator } from '../generators/ConstantsGenerator'
import path from 'path'
import fs from 'fs-extra'
import { RouteManifest } from '@routesync/core'
import { ModelGenerator } from '../generators/ModelGenerator'
import { RoutesGenerator } from '../generators/RoutesGenerator'
import { IntentResolver } from '../resolvers/IntentResolver'


export const generateCommand = new Command('generate')
  .description('Generate typed SDK, types, and hooks from route manifest')
  .option('-m, --manifest <path>', 'Path to route manifest', 'routesync.manifest.json')
  .option('-o, --output <path>', 'Output directory', 'src/api')
  .option('--no-hooks', 'Skip generating React hooks')
  .option('--next-actions', 'Generate Next.js Server Actions')
  .option('--msw', 'Generate MSW Mock Handlers')
  .option('--echo', 'Generate Laravel Echo Hooks')
  .option('--zod', 'Generate Zod schemas for validation')
  .action(async (options) => {
    const spinner = ora('Generating SDK...').start()

    try {
      if (!fs.existsSync(options.manifest)) {
        throw new Error(
          `Manifest not found: ${options.manifest}. Run 'routesync scan' first.`
        )
      }

      let manifest: RouteManifest = await fs.readJson(options.manifest)
      manifest = IntentResolver.resolve(manifest)
      await fs.writeJson(options.manifest, manifest, { spaces: 2 })
      await fs.ensureDir(options.output)

      spinner.text = 'Resolving and validating semantic types...'
      const { SemanticResolutionKernel } = require('@routesync/core')
      const { normalizeManifest } = require('../generators/normalizer')
      const kernel = new SemanticResolutionKernel()
      const normalizedManifest = normalizeManifest(manifest, kernel)

      spinner.text = 'Compiling and emitting full contract bundle...'
      const { CompilerBridge } = await import('../generators/CompilerBridge')
      const emitted = await CompilerBridge.emitFullBundle(manifest, options.output, options)
      console.log(`  [CompilerBridge] Emitted ${emitted.allWrittenPaths.length} compiler & client artifacts successfully:`)
      emitted.allWrittenPaths.forEach(p => console.log(`    ✓ ${path.relative(options.output, p)}`))

      spinner.succeed(chalk.green(`SDK generated → ${options.output}`))
      console.log(`  ${chalk.cyan('api.ts')}     Typed API client`)
      console.log(`  ${chalk.cyan('types.ts')}   Response/request types`)
      if (options.hooks !== false) {
        console.log(`  ${chalk.cyan('hooks.ts')}   React Query hooks`)
      }
      if (options.nextActions) {
        console.log(`  ${chalk.cyan('actions.ts')} Next.js Server Actions`)
      }
      if (options.msw) {
        console.log(`  ${chalk.cyan('mocks.ts')}   MSW Mock Handlers`)
      }
      if (options.echo && manifest.channels) {
        console.log(`  ${chalk.cyan('echo.ts')}    Laravel Echo Hooks`)
      }
      if (manifest.models && manifest.models.length > 0) {
        console.log(`  ${chalk.cyan('models.ts')}  Eloquent Database Models`)
      }
    } catch (err: any) {
      spinner.fail(chalk.red(`Generate failed: ${err.message}`))
      console.error(err.stack)
      process.exit(1)
    }
  })
