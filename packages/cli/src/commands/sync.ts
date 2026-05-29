import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { LaravelRouteParser } from '../parsers/LaravelRouteParser'
import { ManifestGenerator } from '../generators/ManifestGenerator'
import { SDKGenerator } from '../generators/SDKGenerator'
import { TypeGenerator } from '../generators/TypeGenerator'
import { HookGenerator } from '../generators/HookGenerator'
import fs from 'fs-extra'

export const syncCommand = new Command('sync')
  .description('Scan routes and generate SDK in one step')
  .option('-i, --input <path>', 'Path to routes/api.php', 'routes/api.php')
  .option('-o, --output <path>', 'Output directory', 'src/api')
  .option('-b, --baseURL <url>', 'API base URL', 'http://localhost/api')
  .option('--no-hooks', 'Skip generating React hooks')
  .action(async (options) => {
    console.log(chalk.bold.blue('\n  routesync sync\n'))

    const steps = [
      { text: 'Scanning Laravel routes' },
      { text: 'Generating types' },
      { text: 'Generating SDK' },
      { text: 'Generating hooks' }
    ]

    const spinner = ora(steps[0].text).start()

    try {
      // Step 1: Scan
      const parser = new LaravelRouteParser()
      const routes = await parser.parse(options.input)
      const manifest = ManifestGenerator.generate(routes, options.baseURL)
      spinner.succeed(chalk.green(`✔ ${steps[0].text} (${routes.length} routes)`))

      await fs.ensureDir(options.output)

      // Step 2: Types
      spinner.start(steps[1].text)
      await TypeGenerator.generate(manifest, options.output)
      spinner.succeed(chalk.green(`✔ ${steps[1].text}`))

      // Step 3: SDK
      spinner.start(steps[2].text)
      await SDKGenerator.generate(manifest, options.output)
      spinner.succeed(chalk.green(`✔ ${steps[2].text}`))

      // Step 4: Hooks
      if (options.hooks !== false) {
        spinner.start(steps[3].text)
        await HookGenerator.generate(manifest, options.output)
        spinner.succeed(chalk.green(`✔ ${steps[3].text}`))
      }

      console.log(chalk.bold.green('\n  Sync complete!\n'))
      console.log(`  Output: ${chalk.cyan(options.output)}`)
    } catch (err: any) {
      spinner.fail(chalk.red(`Sync failed: ${err.message}`))
      process.exit(1)
    }
  })
