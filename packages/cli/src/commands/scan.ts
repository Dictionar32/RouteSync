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
      
      const { SemanticKernelV2Impl } = await import('@routesync/core')
      const { PhpCodeParser } = await import('../parsers/PhpCodeParser')
      const kernel = new SemanticKernelV2Impl()

      const mapSqlTypeToTs = (sqlType: string): string => {
        const s = sqlType.toLowerCase()
        if (s === 'mixed' || s === 'unknown') return 'unknown'
        if (s.includes('bool') || s.includes('tinyint(1)')) return 'boolean'
        if (s.includes('int') || s.includes('decimal') || s.includes('float') || s.includes('double') || s.includes('numeric')) return 'number'
        return 'string'
      }

      const mapCastToTs = (castType: string, baseType: string): string => {
        const s = castType.toLowerCase()
        if (s.includes('int') || s.includes('float') || s.includes('double') || s.includes('decimal')) return 'number'
        if (s.includes('bool')) return 'boolean'
        if (s.includes('array') || s.includes('json')) return 'any[]'
        if (s.includes('date') || s.includes('datetime')) return 'string'
        return baseType
      }

      const graphModels: Record<string, any> = {}
      if (models) {
        models.forEach((m: any) => {
          const fields: Record<string, any> = {}
          if (m.columns) {
            m.columns.forEach((col: any) => {
              const baseType = mapSqlTypeToTs(col.type)
              let castedType = baseType
              if (m.casts && m.casts[col.name]) {
                castedType = mapCastToTs(m.casts[col.name], baseType)
              }
              fields[col.name] = { type: castedType, nullable: !!col.nullable }
            })
          }
          graphModels[m.name] = {
            kind: 'model_node',
            name: m.name,
            table: m.table,
            fields: fields,
            relations: m.relations, // load relationships
            accessors: m.accessors, // load accessors
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
      
      const resolvedManifest = JSON.parse(JSON.stringify(manifest))
 
      const resolveField = (field: any, contextModel: any, assignments?: any): any => {
        if (!field) return field;
        
        if (field.kind === 'object' && field.fields) {
          for (const key in field.fields) {
            field.fields[key] = resolveField(field.fields[key], contextModel, assignments);
          }
          return field;
        }

        let astToResolve = field;
        if (field.kind === 'raw_code' && field.code) {
           const parsedAst = PhpCodeParser.parseExpression(field.code, field.hints);
           field.parsed_ast = parsedAst;
           astToResolve = parsedAst;
        }
 
        const context = {
          modelMap: {},
          relationMap: {},
          layer: 'resource' as any,
          fileName: contextModel ? `${contextModel.name}Resource` : undefined,
          assignments: assignments || {}
        };

        const resolved = kernel.resolve(astToResolve, context);
        if (resolved && resolved.status !== 'unknown') {
           field.resolved = resolved;
        }
 
        return field;
      }

      // Parse and resolve model accessors
      if (resolvedManifest.models) {
        resolvedManifest.models.forEach((model: any) => {
          if (model.accessors) {
            for (const key in model.accessors) {
              const accessor = model.accessors[key];
              if (accessor) {
                let resolved: any = null;
                let parsedAst: any = null;
                let exprCode = accessor.expression || null;

                if (typeof exprCode === 'string' && exprCode.trim()) {
                  parsedAst = PhpCodeParser.parseExpression(exprCode);
                  const context = {
                    layer: 'model' as any,
                    fileName: model.name,
                    modelMap: {},
                    relationMap: {},
                    assignments: {}
                  };
                  resolved = kernel.resolve(parsedAst, context);
                }

                // Fallback to signature/reflection-extracted type if AST resolution is unknown/unresolved
                if ((!resolved || resolved.status === 'unknown' || resolved.status === 'unresolved') && accessor.type && accessor.type !== 'mixed') {
                  resolved = {
                    status: 'resolved',
                    type: accessor.type,
                    confidence: 100,
                    provenance: [{ step: 'reflection_signature', input: key, output: accessor.type, rule: 'Reflection return type signature' }]
                  };
                }

                if (!resolved) {
                  resolved = {
                    status: 'unknown',
                    type: 'unknown',
                    confidence: 0,
                    provenance: []
                  };
                }

                model.accessors[key] = {
                  expression_code: exprCode,
                  parsed_ast: parsedAst,
                  expression: resolved
                };
              }
            }
          }
          // Update the kernel's graph node with the resolved accessors!
          const graphModel = graphModels[model.name];
          if (graphModel) {
            graphModel.accessors = model.accessors;
          }
        });
      }
 
      if (resolvedManifest.resources) {
        resolvedManifest.resources.forEach((res: any) => {
          let contextModel = models ? models.find((m: any) => m.name === res.model) : null;
          if (!contextModel && res.name.endsWith('Resource')) {
              contextModel = models ? models.find((m: any) => m.name === res.name.replace('Resource', '')) : null;
          }

          // Pre-parse assignments for data-flow tracking
          const parsedAssignments: Record<string, any> = {};
          if (res.assignments) {
            for (const varName in res.assignments) {
              const code = res.assignments[varName];
              parsedAssignments[varName] = PhpCodeParser.parseExpression(code, {});
            }
          }

          if (res.fields) {
            for (const key in res.fields) {
              res.fields[key] = resolveField(res.fields[key], contextModel || res, parsedAssignments)
            }
          }
        })
      }

      if (resolvedManifest.routes) {
        resolvedManifest.routes.forEach((route: any) => {
          const parsedAssignments: Record<string, any> = {};
          if (route.assignments) {
            for (const varName in route.assignments) {
              const code = route.assignments[varName];
              parsedAssignments[varName] = PhpCodeParser.parseExpression(code, {});
            }
          }

          if (route.response && route.response.kind !== 'primitive' && route.response.kind !== 'object' && route.response.kind !== 'array') {
             route.response = resolveField(route.response, null, parsedAssignments)
          } else if (route.response && route.response.kind === 'object' && route.response.fields) {
             for (const key in route.response.fields) {
                if (route.response.fields[key].kind && route.response.fields[key].kind !== 'primitive') {
                   route.response.fields[key] = resolveField(route.response.fields[key], null, parsedAssignments)
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
