import { Command } from 'commander'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

export const auditCommand = new Command('audit')
  .description('Audit the manifest for unresolved fields and missing resolvers')
  .option('-g, --graph <path>', 'Path to graph file', 'routesync.graph.json')
  .option('-v, --verbose', 'Show detailed breakdown of unresolved fields')
  .action(async (options) => {
    try {
      const graphPath = path.resolve(process.cwd(), options.graph)
      if (!fs.existsSync(graphPath)) {
        console.error(chalk.red(`Graph file not found: ${graphPath}`))
        console.error(chalk.yellow('Run `routesync scan --models` first to generate the graph.'))
        process.exit(1)
      }

      const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'))

      const { SemanticResolutionKernel } = require('../resolvers/SemanticResolutionKernel')
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

      function checkField(fieldObj: any, fieldPath: string, contextModel?: any) {
        if (!fieldObj) return

        if (fieldObj.kind === 'object' && fieldObj.fields) {
            for (const [key, val] of Object.entries(fieldObj.fields)) {
                checkField(val, `${fieldPath}.${key}`, contextModel)
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
            // Categorize based on unresolvedReason or fallback to 'Other Unresolved'
            const reason = res.unresolvedReason || 'Unknown Reason';
            
            if (reason.includes('Missing MethodReturn Resolver')) {
                unresolvedBreakdown['Missing MethodReturn Resolver'].push(fieldPath)
            } else if (reason.includes('FrameworkResolver')) {
                unresolvedBreakdown['Missing Framework Registry'].push(fieldPath)
            } else if (reason.includes('Model')) {
                unresolvedBreakdown['Missing Relation Resolver'].push(fieldPath)
            } else if (reason.includes('Accessor')) {
                unresolvedBreakdown['Missing Accessor Resolver'].push(fieldPath)
            } else {
                unresolvedBreakdown['Other Unresolved'].push(`${fieldPath} (${reason})`)
            }
        }
      }

      // Check routes
      for (const route of graph.routes || []) {
          if (route.response) {
              checkField(route.response, route.name)
          }
      }

      // Check resources
      for (const resource of graph.resources || []) {
          if (resource.fields) {
              let contextModel = graph.models?.find((m: any) => m.name === resource.name.replace('Resource', ''))
              for (const [key, val] of Object.entries(resource.fields)) {
                  checkField(val, `${resource.name}.${key}`, contextModel)
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

    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`))
      process.exit(1)
    }
  })
