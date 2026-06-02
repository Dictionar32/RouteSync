import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { LaravelRouteParser } from '../parsers/LaravelRouteParser'
import { ManifestGenerator } from '../generators/ManifestGenerator'
import { SDKGenerator } from '../generators/SDKGenerator'
import { TypeGenerator } from '../generators/TypeGenerator'
import { ZodTierGenerator } from '../generators/ZodTierGenerator'
import { HookGenerator } from '../generators/HookGenerator'
import { NextActionGenerator } from '../generators/NextActionGenerator'
import { MswGenerator } from '../generators/MswGenerator'
import { LaravelChannelParser } from '../parsers/LaravelChannelParser'
import { EchoGenerator } from '../generators/EchoGenerator'
import { IndexGenerator } from '../generators/IndexGenerator'
import { ModelGenerator } from '../generators/ModelGenerator'
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
      // Step 1: Scan
      const parser = new LaravelRouteParser()
      const { routes, models, resources } = await parser.parse(options.input, { extractModels: options.models })
      const channelParser = new LaravelChannelParser()
      const channels = options.echo ? await channelParser.parse('routes/channels.php') : []
      const manifest = ManifestGenerator.generate(routes, options.baseURL, channels)
      if (options.models) { manifest.models = models; manifest.resources = resources; }
      spinner.succeed(chalk.green(`✔ ${steps[0].text} (${routes.length} routes, ${channels.length} channels, ${models.length} models)`))

      await fs.ensureDir(options.output)

      // Step 2: Types
      spinner.start(steps[1].text)
      await TypeGenerator.generate(manifest, options.output)
      
      if (options.zod) {
        await ZodTierGenerator.generate(manifest, options.output)
      }
      spinner.succeed(chalk.green(`✔ ${steps[1].text}`))

      // Step 3: SDK
      spinner.start(steps[2].text)
      await SDKGenerator.generate(manifest, options.output, options)
      spinner.succeed(chalk.green(`✔ ${steps[2].text}`))

      // Step 4: Hooks
      if (options.hooks !== false) {
        spinner.start(steps[3].text)
        await HookGenerator.generate(manifest, options.output)
        spinner.succeed(chalk.green(`✔ ${steps[3].text}`))
        console.warn(chalk.yellow('\n  [DEPRECATED] Hook generation will be disabled by default in v2. Please migrate to useApiQuery().\n'))
      }
      
      // Step 5: Server Actions
      if (options.nextActions) {
        spinner.start(steps[4].text)
        await NextActionGenerator.generate(manifest, options.output)
        spinner.succeed(chalk.green(`✔ ${steps[4].text}`))
      }

      // Step 6: MSW
      if (options.msw) {
        spinner.start('Generating MSW Mocks')
        await MswGenerator.generate(manifest, options.output)
        spinner.succeed(chalk.green(`✔ Generating MSW Mocks`))
      }

      // Step 7: Echo
      if (options.echo && manifest.channels) {
        spinner.start('Generating Echo Hooks')
        await EchoGenerator.generate(manifest.channels, options.output)
        spinner.succeed(chalk.green(`✔ Generating Echo Hooks`))
      }

      // Step 7.5: Models
      if (options.models && manifest.models) {
        spinner.start('Generating DB Models')
        await ModelGenerator.generate(manifest, options.output)
        spinner.succeed(chalk.green(`✔ Generating DB Models`))
      }

      // Step 8: Index Files
      spinner.start('Generating Index Files')
      await IndexGenerator.generate(manifest, options.output, options)
      spinner.succeed(chalk.green(`✔ Generating Index Files`))

      console.log(chalk.bold.green('\n  Sync complete!\n'))
      console.log(`  Output: ${chalk.cyan(options.output)}`)
    } catch (err: any) {
      spinner.fail(chalk.red(`Sync failed: ${err.message}`))
      process.exit(1)
    }
  })

