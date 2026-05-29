import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { SDKGenerator } from '../generators/SDKGenerator'
import { TypeGenerator } from '../generators/TypeGenerator'
import { HookGenerator } from '../generators/HookGenerator'
import path from 'path'
import fs from 'fs-extra'
import { RouteManifest } from '@routesync/core'

export const generateCommand = new Command('generate')
  .description('Generate typed SDK, types, and hooks from route manifest')
  .option('-m, --manifest <path>', 'Path to route manifest', 'routesync.manifest.json')
  .option('-o, --output <path>', 'Output directory', 'src/api')
  .option('--no-hooks', 'Skip generating React hooks')
  .action(async (options) => {
    const spinner = ora('Generating SDK...').start()

    try {
      if (!fs.existsSync(options.manifest)) {
        throw new Error(
          `Manifest not found: ${options.manifest}. Run 'routesync scan' first.`
        )
      }

      const manifest: RouteManifest = await fs.readJson(options.manifest)
      await fs.ensureDir(options.output)

      spinner.text = 'Generating types...'
      await TypeGenerator.generate(manifest, options.output)

      spinner.text = 'Generating SDK...'
      await SDKGenerator.generate(manifest, options.output)

      if (options.hooks !== false) {
        spinner.text = 'Generating hooks...'
        await HookGenerator.generate(manifest, options.output)
      }

      spinner.succeed(chalk.green(`SDK generated → ${options.output}`))
      console.log(`  ${chalk.cyan('api.ts')}     Typed API client`)
      console.log(`  ${chalk.cyan('types.ts')}   Response/request types`)
      if (options.hooks !== false) {
        console.log(`  ${chalk.cyan('hooks.ts')}   React Query hooks`)
      }
    } catch (err: any) {
      spinner.fail(chalk.red(`Generate failed: ${err.message}`))
      process.exit(1)
    }
  })
