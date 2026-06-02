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
      const { PhpCodeParser } = await import('../parsers/PhpCodeParser')
      const kernel = new SemanticResolutionKernel()
      kernel.models = models || []
      kernel.resources = resources || []
      
      const resolvedManifest = JSON.parse(JSON.stringify(manifest))

      const resolveField = (field: any, contextModel: any) => {
        if (!field) return field;
        
        // 1. PHP extraction gave us raw_code
        // 2. Parse Layer (PhpCodeParser) -> ast_unresolved
        let astToResolve = field;
        if (field.kind === 'raw_code' && field.code) {
           const parsedAst = PhpCodeParser.parseExpression(field.code, field.hints);
           // We can attach the parsed AST so SDK generators can see the structure if kernel fails
           field.parsed_ast = parsedAst;
           astToResolve = parsedAst;
        }

        // 3. Resolve Layer (SemanticResolutionKernel) -> ast_resolved
        const resolved = kernel.resolve(astToResolve, contextModel);
        if (resolved && resolved.status !== 'unresolved') {
           field.resolved = resolved;
        }

        return field;
      }

      if (resolvedManifest.resources) {
        resolvedManifest.resources.forEach((res: any) => {
          let contextModel = kernel.models.find((m: any) => m.name === res.model);
          if (!contextModel && res.name.endsWith('Resource')) {
              contextModel = kernel.models.find((m: any) => m.name === res.name.replace('Resource', ''));
          }

          if (res.fields) {
            for (const key in res.fields) {
              res.fields[key] = resolveField(res.fields[key], contextModel || res)
            }
          }
        })
      }

      if (resolvedManifest.routes) {
        resolvedManifest.routes.forEach((route: any) => {
          if (route.response && route.response.kind !== 'primitive' && route.response.kind !== 'object' && route.response.kind !== 'array') {
             route.response = resolveField(route.response, null)
          } else if (route.response && route.response.kind === 'object' && route.response.fields) {
             for (const key in route.response.fields) {
                if (route.response.fields[key].kind && route.response.fields[key].kind !== 'primitive') {
                   route.response.fields[key] = resolveField(route.response.fields[key], null)
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
