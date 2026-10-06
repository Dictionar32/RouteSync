import { Command } from 'commander'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

export const explainCommand = new Command('explain')
  .description('Explain the type resolution evidence for a specific field')
  .argument('<path>', 'Field path (e.g. login.post.data.user.role or PaymentResource.provider)')
  .option('-g, --graph <path>', 'Path to graph file', 'routesync.graph.json')
  .action(async (fieldPath, options) => {
    try {
      const graphPath = path.resolve(process.cwd(), options.graph)
      if (!fs.existsSync(graphPath)) {
        console.error(chalk.red(`Graph file not found: ${graphPath}`))
        console.error(chalk.yellow('Run `routesync scan --models` first to generate the graph.'))
        process.exit(1)
      }

      const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'))
      const parts = fieldPath.split('.')
      
      let targetObj = null
      let targetType = ''
      let remainingParts: string[] = []

      // 1. Check if parts[0] is a Resource
      if (graph.resources && graph.resources.some((r: any) => r.name === parts[0])) {
        targetObj = graph.resources.find((r: any) => r.name === parts[0])
        targetType = 'resource'
        remainingParts = parts.slice(1)
      }
      // 2. Check if parts[0] is a Model
      else if (graph.models && graph.models.some((m: any) => m.name === parts[0])) {
        targetObj = graph.models.find((m: any) => m.name === parts[0])
        targetType = 'model'
        remainingParts = parts.slice(1)
      }
      // 3. Fallback to route checking
      else {
        for (let i = 1; i <= parts.length; i++) {
          const potentialName = parts.slice(0, i).join('.')
          const route = graph.routes.find((r: any) => r.name === potentialName)
          if (route) {
            targetType = 'route'
            targetObj = route
            remainingParts = parts.slice(i)
            break
          }
        }
      }

      if (!targetObj) {
        console.error(chalk.red(`Could not find Resource, Model, or Route matching prefix in path: ${fieldPath}`))
        process.exit(1)
      }

      let current: any = null
      
      if (targetType === 'resource') {
        current = { kind: 'object', fields: targetObj.fields }
      } else if (targetType === 'model') {
        // Models themselves don't have a nested field structure in the same way in the graph, 
        // but we can mock it for traversal if needed, or just stop.
        console.error(chalk.yellow(`Explanation for direct models is not fully supported yet.`))
        process.exit(1)
      } else {
        current = targetObj.response
        if (!current && remainingParts.length > 0) {
            console.error(chalk.red(`Route ${targetObj.name} has no response metadata extracted.`))
            process.exit(1)
        }
      }

      for (const part of remainingParts) {
        if (!current) break;
        if (current.kind === 'object' && current.fields) {
          current = current.fields[part]
        } else {
          current = undefined
        }
      }

      if (!current) {
        console.error(chalk.red(`Field path not found in graph: ${fieldPath}`))
        process.exit(1)
      }

      console.log(chalk.bold('Field:'))
      console.log(fieldPath)
      console.log('')

      const resolvedType = current.type ?? current.schemaType ?? current.kind ?? 'unknown'
      console.log(chalk.bold('Type:'))
      console.log(resolvedType === 'unknown' ? chalk.yellow(resolvedType) : chalk.green(String(resolvedType)))
      console.log('')

      console.log(chalk.bold('Evidence:'))
      const evidence = current.evidence ?? current.provenance ?? current.source ?? null
      if (evidence) {
        console.log(JSON.stringify(evidence, null, 2))
      } else {
        console.log(chalk.yellow('No explicit evidence metadata on this graph node.'))
      }
      console.log('')

      console.log(chalk.bold('Trace Chain:'))
      console.log(chalk.gray('No secondary semantic resolver is invoked; explanation uses canonical graph evidence.'))
      console.log('')

      console.log(chalk.bold('Reason:'))
      console.log(chalk.green('Reported from canonical upstream-derived graph metadata.'))
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`))
      process.exit(1)
    }
  })
