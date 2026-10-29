import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import path from 'path'
import fs from 'fs-extra'
import { type RouteManifest } from '@routesync/core'
import { manifestCodeGenerationOperation } from '../generators/manifestCodeGenerationOperation'

export interface GenerateCommandInterface extends Command {}

export const generateCommand: GenerateCommandInterface = new Command('generate')
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
      await fs.ensureDir(options.output)

      spinner.text = 'Resolving upstream manifest code-generation operation...'
      const generation = manifestCodeGenerationOperation.emit({
        manifest,
        outputDir: options.output,
        options,
      })
      generation.requireCompleteGeneration()

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : undefined
      spinner.fail(chalk.red(`Generate failed: ${message}`))
      if (stack) console.error(stack)
      process.exit(1)
    }
  })
