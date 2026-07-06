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

      const manifest: RouteManifest = await fs.readJson(options.manifest)
      await fs.ensureDir(options.output)

      spinner.text = 'Generating types...'
      await TypeGenerator.generate(manifest, options.output)
      spinner.text = 'Generating SDK...'
      await SDKGenerator.generate(manifest, options.output, options)

      if (options.hooks !== false) {
        spinner.text = 'Generating query keys...'
        await QueryKeyGenerator.generate(manifest, options.output)
        spinner.text = 'Generating hooks...'
        await HookGenerator.generate(manifest, options.output)
      }

      if (options.nextActions) {
        spinner.text = 'Generating Server Actions...'
        await NextActionGenerator.generate(manifest, options.output)
      }

      if (options.msw) {
        spinner.text = 'Generating MSW Mocks...'
        await MswGenerator.generate(manifest, options.output)
      }

      if (options.echo && manifest.channels) {
        spinner.text = 'Generating Echo Hooks...'
        await EchoGenerator.generate(manifest.channels, options.output)
      }

      if (manifest.models) {
        spinner.text = 'Generating DB Models...'
        await ModelGenerator.generate(manifest, options.output)
      }

      spinner.text = 'Generating Zod Tier (Contract, Types, Mappers)...'
      const { ZodTierGenerator } = require('../generators/ZodTierGenerator')
      await ZodTierGenerator.generate(manifest, options.output)

      // Generate routes.ts if pages exists in manifest
      spinner.text = 'Generating Frontend Routes...'
      const routesGenerated = await RoutesGenerator.generate(manifest, options.output)

      spinner.text = 'Generating Constants and Enums...'
      await ConstantsGenerator.generate(manifest, options.output)

      spinner.text = 'Generating Index Files...'
      await IndexGenerator.generate(manifest, options.output, { ...options, routesGenerated })

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
      process.exit(1)
    }
  })
  