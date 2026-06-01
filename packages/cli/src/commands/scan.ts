import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { LaravelRouteParser } from '../parsers/LaravelRouteParser'
import { ManifestGenerator } from '../generators/ManifestGenerator'

export const scanCommand = new Command('scan')
  .description('Scan Laravel/PHP routes and output a route manifest')
  .option('-i, --input <path>', 'Path to routes/api.php', 'routes/api.php')
  .option('-o, --output <path>', 'Output manifest path', 'routesync.manifest.json')
  .option('-b, --baseURL <url>', 'API base URL', 'http://localhost/api')
  .option('--models', 'Extract Database Schema via Eloquent Models')
  .action(async (options) => {
    const spinner = ora('Scanning routes...').start()

    try {
      const parser = new LaravelRouteParser()
      const { routes, models } = await parser.parse(options.input, { extractModels: options.models })

      const manifest = ManifestGenerator.generate(routes, options.baseURL)
      if (options.models) manifest.models = models
      await ManifestGenerator.save(manifest, options.output)

      spinner.succeed(
        chalk.green(`Found ${routes.length} routes, ${models.length} models → ${options.output}`)
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
    } catch (err: any) {
      spinner.fail(chalk.red(`Scan failed: ${err.message}`))
      process.exit(1)
    }
  })
