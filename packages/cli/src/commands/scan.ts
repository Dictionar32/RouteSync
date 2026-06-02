import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { LaravelRouteParser } from '../parsers/LaravelRouteParser'
import { ManifestGenerator } from '../generators/ManifestGenerator'

export const scanCommand = new Command('scan')
  .description('Scan Laravel/PHP routes and output a route manifest')
  .argument('[projectDir]', 'Path to Laravel project root')
  .option('-i, --input <path>', 'Path to routes/api.php (relative to projectDir or absolute)', 'routes/api.php')
  .option('-o, --output <path>', 'Output manifest path', 'routesync.manifest.json')
  .option('-b, --baseURL <url>', 'API base URL', 'http://localhost/api')
  .option('--models', 'Extract Database Schema via Eloquent Models')
  .action(async (projectDir, options) => {
    const spinner = ora('Scanning routes...').start()

    // Resolve paths
    const path = require('path')
    const targetDir = projectDir ? path.resolve(process.cwd(), projectDir) : process.cwd()
    const inputPath = path.isAbsolute(options.input) ? options.input : path.resolve(targetDir, options.input)
    const outputPath = path.isAbsolute(options.output) ? options.output : path.resolve(targetDir, options.output)

    try {
      const parser = new LaravelRouteParser()
      const { routes, models, resources } = await parser.parse(inputPath, { extractModels: options.models })

      const manifest = ManifestGenerator.generate(routes, options.baseURL)
      if (options.models) {
        manifest.models = models
        manifest.resources = resources
      }
      
      const { SemanticResolutionKernel } = await import('../resolvers/SemanticResolutionKernel')
      const kernel = new SemanticResolutionKernel()
      kernel.models = models || []
      kernel.resources = resources || []
      
      const resolvedManifest = JSON.parse(JSON.stringify(manifest))

      if (resolvedManifest.resources) {
        resolvedManifest.resources.forEach((res: any) => {
          if (res.fields) {
            for (const key in res.fields) {
              const result = kernel.resolve(res.fields[key], res)
              if (result && result.status !== 'unresolved') {
                res.fields[key] = result
              }
            }
          }
        })
      }

      if (resolvedManifest.routes) {
        resolvedManifest.routes.forEach((route: any) => {
          if (route.response && route.response.kind !== 'primitive' && route.response.kind !== 'object' && route.response.kind !== 'array') {
             const result = kernel.resolve(route.response)
             if (result && result.status !== 'unresolved') {
                route.response = result
             }
          } else if (route.response && route.response.kind === 'object' && route.response.fields) {
             for (const key in route.response.fields) {
                if (route.response.fields[key].kind && route.response.fields[key].kind !== 'primitive') {
                   const result = kernel.resolve(route.response.fields[key])
                   if (result && result.status !== 'unresolved') {
                      route.response.fields[key] = result
                   }
                }
             }
          }
        })
      }

      await ManifestGenerator.save(resolvedManifest, outputPath)
      const fs = require('fs')
      fs.writeFileSync(path.resolve(path.dirname(outputPath), 'routesync.graph.json'), JSON.stringify(resolvedManifest, null, 2))

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
    } catch (err: any) {
      spinner.fail(chalk.red(`Scan failed: ${err.message}`))
      process.exit(1)
    }
  })
