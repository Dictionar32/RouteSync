import { Command } from 'commander'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

interface ScannedRoute {
  method: string;
  path: string;
  auth: boolean;
  schema?: Record<string, unknown> | null;
  response?: Record<string, unknown> | null;
  assignments?: Record<string, string> | null;
  stableHash?: string;
  name?: string;
}

interface ScannedManifest {
  routes?: ScannedRoute[];
  models?: Array<Record<string, unknown>>;
  resources?: Array<Record<string, unknown>>;
}

export const auditCommand = new Command('audit')
  .description('Audit the manifest for unresolved fields and missing resolvers')
  .option('-g, --graph <path>', 'Path to graph file', 'routesync.graph.json')
  .option('-m, --manifest <path>', 'Path to manifest file', 'routesync.manifest.json')
  .option('-i, --input <path>', 'Path to routes/api.php', 'routes/api.php')
  .option('--check-drift', 'Verify that the manifest matches current routes')
  .option('-v, --verbose', 'Show detailed breakdown of unresolved fields')
  .action(async (options) => {
    try {
      if (options.checkDrift) {
        const manifestPath = path.resolve(process.cwd(), options.manifest)
        if (!fs.existsSync(manifestPath)) {
          console.error(chalk.red(`Manifest file not found: ${manifestPath}`))
          process.exit(1)
        }

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as ScannedManifest
        const { LaravelRouteParser } = require('../parsers/LaravelRouteParser')
        const parser = new LaravelRouteParser()
        const { routes } = await parser.parse(options.input, { extractModels: false })

        const freshRoutes = new Map<string, ScannedRoute>()
        routes.forEach((r: ScannedRoute) => {
          const replacer = (key: string, value: unknown) => {
            if (key === 'resolved' || key === 'parsed_ast') return undefined
            return value
          }
          const content = JSON.stringify({
            method: r.method,
            path: r.path,
            auth: r.auth,
            schema: r.schema || null,
            response: r.response || null,
            assignments: r.assignments || null
          }, replacer)
          const hash = require('crypto').createHash('sha256').update(content).digest('hex')
          freshRoutes.set(`${r.method}:${r.path}`, { ...r, stableHash: hash })
        })

        const manifestRoutes = new Map<string, ScannedRoute>()
        if (manifest.routes) {
          manifest.routes.forEach((r: ScannedRoute) => {
            manifestRoutes.set(`${r.method}:${r.path}`, r)
          })
        }

        const added: string[] = []
        const removed: string[] = []
        const changed: string[] = []

        for (const [key, freshRoute] of freshRoutes.entries()) {
          const mRoute = manifestRoutes.get(key)
          if (!mRoute) {
            added.push(`  + ${freshRoute.method} ${freshRoute.path}`)
          } else if (mRoute.stableHash !== freshRoute.stableHash) {
            changed.push(`  ~ ${freshRoute.method} ${freshRoute.path} (stableHash changed)`)
          }
        }

        for (const [key, mRoute] of manifestRoutes.entries()) {
          if (!freshRoutes.has(key)) {
            removed.push(`  - ${mRoute.method} ${mRoute.path}`)
          }
        }

        if (added.length > 0 || removed.length > 0 || changed.length > 0) {
          console.error(chalk.red.bold('\n[RouteSync Error] Manifest drift detected!'))
          if (added.length > 0) {
            console.error(chalk.green(`\nAdded routes:\n${added.join('\n')}`))
          }
          if (removed.length > 0) {
            console.error(chalk.red(`\nRemoved routes:\n${removed.join('\n')}`))
          }
          if (changed.length > 0) {
            console.error(chalk.yellow(`\nModified routes:\n${changed.join('\n')}`))
          }
          console.error(chalk.yellow('\nRun `routesync scan` or `routesync sync` to update the manifest file.\n'))
          process.exit(1)
        }

        console.log(chalk.green('\n✔ Manifest matches current Laravel routes. No drift detected.\n'))
        process.exit(0)
      }

      const graphPath = path.resolve(process.cwd(), options.graph)
      if (!fs.existsSync(graphPath)) {
        console.error(chalk.red(`Graph file not found: ${graphPath}`))
        console.error(chalk.yellow('Run `routesync scan --models` first to generate the graph.'))
        process.exit(1)
      }

      const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'))

      const { SemanticResolutionKernel } = require('@routesync/core')
      const resolver = new SemanticResolutionKernel(graph.models || [], graph.resources || [])

      let resolvedCount = 0
      let explainableCount = 0
      
      const unresolvedBreakdown: Record<string, string[]> = {
        'Missing MethodReturn Resolver': [],
        'Missing ResourceGraph Resolver': [],
        'Missing Framework Registry': [],
        'Missing Accessor Resolver': [],
        'Missing Relation Resolver': [],
        'Dynamic Runtime Value': [],
        'External Service Boundary': [],
        'Other Unresolved': [],
      }

      function checkField(fieldObj: Record<string, unknown> | undefined | null, fieldPath: string, contextModel?: Record<string, unknown> | null) {
        if (!fieldObj) return

        if (fieldObj.kind === 'object' && fieldObj.fields) {
            const fields = fieldObj.fields as Record<string, unknown>
            for (const [key, val] of Object.entries(fields)) {
                checkField(val as Record<string, unknown>, `${fieldPath}.${key}`, contextModel)
            }
            return
        }
        
        if (fieldObj.collection && fieldObj.paginated === undefined && fieldObj.resource === undefined && fieldObj.model === undefined && fieldObj.kind !== 'resource') {
            // Arrays that are primitives
        }

        const res = resolver.resolve(fieldObj, contextModel)
        explainableCount++

        if (res.status === 'resolved') {
            resolvedCount++
        } else {
            const lastTrace = res.trace && res.trace.length > 0 ? res.trace[res.trace.length - 1] as Record<string, unknown> : null;
            const reasonRule = typeof lastTrace?.rule === 'string' ? lastTrace.rule : 'Unknown Reason';
            const reasonSource = typeof lastTrace?.source === 'string' ? lastTrace.source : '';
            
            if (reasonRule.includes('MethodReturn') || reasonSource.includes('MethodReturnResolver')) {
                unresolvedBreakdown['Missing MethodReturn Resolver'].push(fieldPath)
            } else if (reasonRule.includes('FrameworkResolver') || reasonSource.includes('FrameworkRegistryResolver')) {
                unresolvedBreakdown['Missing Framework Registry'].push(fieldPath)
            } else if (reasonRule.includes('Model') || reasonSource.includes('ModelColumnResolver')) {
                unresolvedBreakdown['Missing Relation Resolver'].push(fieldPath)
            } else if (reasonRule.includes('Accessor') || reasonSource.includes('AccessorResolver')) {
                unresolvedBreakdown['Missing Accessor Resolver'].push(fieldPath)
            } else {
                unresolvedBreakdown['Other Unresolved'].push(`${fieldPath} (${reasonRule})`)
            }
        }
      }

      // Check routes
      const routesList = (graph.routes || []) as Array<Record<string, unknown>>
      for (const route of routesList) {
          if (route.response) {
              const nameStr = typeof route.name === 'string' ? route.name : 'UnknownRoute'
              checkField(route.response as Record<string, unknown>, nameStr)
          }
      }

      // Check resources
      const resourcesList = (graph.resources || []) as Array<Record<string, unknown>>
      for (const resource of resourcesList) {
          if (resource.fields) {
              const resName = typeof resource.name === 'string' ? resource.name : 'UnknownResource'
              const modelsList = (graph.models || []) as Array<Record<string, unknown>>
              const contextModel = modelsList.find((m) => m.name === resName.replace('Resource', ''))
              const fields = resource.fields as Record<string, unknown>
              for (const [key, val] of Object.entries(fields)) {
                  checkField(val as Record<string, unknown>, `${resName}.${key}`, contextModel)
              }
          }
      }

      console.log(chalk.bold('\nSemantic Coverage\n─────────────────'))
      
      const coverage = explainableCount > 0 ? Math.round((resolvedCount / explainableCount) * 100) : 0
      console.log(`Resolved: ${coverage === 100 ? chalk.green('100%') : chalk.yellow(coverage + '%')}`)
      console.log(`Explainable: ${chalk.green('100%')}\n`)
      
      let hasUnresolved = false;
      for (const items of Object.values(unresolvedBreakdown)) {
          if (items.length > 0) hasUnresolved = true;
      }

      if (hasUnresolved) {
          console.log(chalk.bold('Unresolved:'))
          for (const [category, items] of Object.entries(unresolvedBreakdown)) {
              if (items.length > 0) {
                  console.log(`  ${category}: ${items.length}`)
              }
          }
          console.log('')

          if (options.verbose) {
              for (const [category, items] of Object.entries(unresolvedBreakdown)) {
                  if (items.length > 0) {
                      console.log(chalk.yellow(`[${category}]`))
                      items.forEach(i => console.log(`  - ${i}`))
                  }
              }
              console.log(chalk.bold('Suggested Action:'))
              console.log('Implement Laravel Attribute Resolver / Check dynamic runtime values.\n')
          } else {
              console.log(chalk.gray('Run `routesync audit --verbose` for details.\n'))
          }
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(chalk.red(`Error: ${msg}`))
      process.exit(1)
    }
  })
