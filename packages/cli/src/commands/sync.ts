import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { LaravelRouteParser } from '../parsers/LaravelRouteParser'
import { ManifestGenerator } from '../generators/ManifestGenerator'
import { SDKGenerator } from '../generators/SDKGenerator'
import { TypeGenerator } from '../generators/TypeGenerator'
import { ZodTierGenerator } from '../generators/ZodTierGenerator'
import { HookGenerator } from '../generators/HookGenerator'
import { ValuesGenerator } from '../generators/ValuesGenerator'
import { NextActionGenerator } from '../generators/NextActionGenerator'
import { MswGenerator } from '../generators/MswGenerator'
import { LaravelChannelParser } from '../parsers/LaravelChannelParser'
import { EchoGenerator } from '../generators/EchoGenerator'
import { IndexGenerator } from '../generators/IndexGenerator'
import { ModelGenerator } from '../generators/ModelGenerator'
import { QueryKeyGenerator } from '../generators/QueryKeyGenerator'
import { ConstantsGenerator } from '../generators/ConstantsGenerator'
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
      if (options.models) {
        manifest.models = models
        manifest.resources = resources
      }

      // Semantic Kernel V2 resolution (same as in scan.ts)
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
            relations: m.relations,
            accessors: m.accessors,
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
 
      const resolveField = (field: any, contextModel: any, assignments?: any, resolvedAssignments?: any): any => {
        if (!field) return field;
        
        if (field.kind === 'object' && field.fields) {
          for (const key in field.fields) {
            field.fields[key] = resolveField(field.fields[key], contextModel, assignments, resolvedAssignments);
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
          assignments: assignments || {},
          resolvedAssignments: resolvedAssignments || {}
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

                if ((!resolved || resolved.status === 'unknown') && accessor.type && accessor.type !== 'mixed') {
                  resolved = {
                    status: 'resolved',
                    type: accessor.type,
                    confidence: 100,
                    trace: [{ source: 'ReflectionScanner', input: key, output: accessor.type, rule: 'Reflection return type signature' }]
                  };
                }

                if (!resolved) {
                  resolved = {
                    status: 'unknown',
                    type: 'unknown',
                    confidence: 0,
                    trace: []
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

          const parsedAssignments: Record<string, any> = {};
          const resolvedAssignments: Record<string, any> = {};
          const contextForAssignments = {
            modelMap: {},
            relationMap: {},
            layer: 'resource' as any,
            fileName: contextModel ? `${contextModel.name}Resource` : (res.name.endsWith('Resource') ? res.name : `${res.name}Resource`),
            assignments: parsedAssignments,
            resolvedAssignments: resolvedAssignments
          };

          if (res.assignments) {
            for (const varName in res.assignments) {
              const code = res.assignments[varName];
              const ast = PhpCodeParser.parseExpression(code, {});
              parsedAssignments[varName] = ast;
              const resolved = kernel.resolve(ast, contextForAssignments);
              if (resolved && resolved.status !== 'unknown') {
                resolvedAssignments[varName] = resolved;
              }
            }
          }

          if (res.fields) {
            for (const key in res.fields) {
              res.fields[key] = resolveField(res.fields[key], contextModel || res, parsedAssignments, resolvedAssignments)
            }
          }
        })
      }

      if (resolvedManifest.routes) {
        resolvedManifest.routes.forEach((route: any) => {
          const parsedAssignments: Record<string, any> = {};
          const resolvedAssignments: Record<string, any> = {};
          const contextForAssignments = {
            modelMap: {},
            relationMap: {},
            layer: 'route' as any,
            fileName: route.name,
            assignments: parsedAssignments,
            resolvedAssignments: resolvedAssignments
          };

          if (route.assignments) {
            for (const varName in route.assignments) {
              const code = route.assignments[varName];
              const ast = PhpCodeParser.parseExpression(code, {});
              parsedAssignments[varName] = ast;
              const resolved = kernel.resolve(ast, contextForAssignments);
              if (resolved && resolved.status !== 'unknown') {
                resolvedAssignments[varName] = resolved;
              }
            }
          }

          if (route.response && route.response.kind !== 'primitive' && route.response.kind !== 'object' && route.response.kind !== 'array') {
             route.response = resolveField(route.response, null, parsedAssignments, resolvedAssignments)
          } else if (route.response && route.response.kind === 'object' && route.response.fields) {
             for (const key in route.response.fields) {
                if (route.response.fields[key].kind && route.response.fields[key].kind !== 'primitive') {
                   route.response.fields[key] = resolveField(route.response.fields[key], null, parsedAssignments, resolvedAssignments)
                }
              }
          }
        })
      }

      // Save the resolved manifest locally
      const pathModule = require('path')
      const localManifestPath = pathModule.resolve(process.cwd(), 'routesync.manifest.json')
      await ManifestGenerator.save(resolvedManifest, localManifestPath)

      spinner.succeed(chalk.green(`✔ ${steps[0].text} (${routes.length} routes, ${channels.length} channels, ${models ? models.length : 0} models)`))

      await fs.ensureDir(options.output)

      // Step 2: Types
      spinner.start(steps[1].text)
      await TypeGenerator.generate(resolvedManifest, options.output)
      
      if (options.zod) {
        await ZodTierGenerator.generate(resolvedManifest, options.output)
      }
      spinner.succeed(chalk.green(`✔ ${steps[1].text}`))

      // Step 3: SDK
      spinner.start(steps[2].text)
      await SDKGenerator.generate(resolvedManifest, options.output, options)
      spinner.succeed(chalk.green(`✔ ${steps[2].text}`))

      // Step 4: Hooks
      if (options.hooks !== false) {
        spinner.start(steps[3].text)
        await QueryKeyGenerator.generate(resolvedManifest, options.output)
        await ValuesGenerator.generate(resolvedManifest, options.output)
        await HookGenerator.generate(resolvedManifest, options.output)
        spinner.succeed(chalk.green(`✔ ${steps[3].text}`))
        console.warn(chalk.yellow('\n  [DEPRECATED] Hook generation will be disabled by default in v2. Please migrate to useApiQuery().\n'))
      }
      
      // Step 5: Server Actions
      if (options.nextActions) {
        spinner.start(steps[4].text)
        await NextActionGenerator.generate(resolvedManifest, options.output)
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

