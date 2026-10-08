import { Command } from 'commander'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

type ExplainEvidence = Readonly<Record<string, unknown>>

type ExplainField = {
  readonly type?: string
  readonly schemaType?: string
  readonly kind?: string
  readonly evidence?: ExplainEvidence
  readonly provenance?: ExplainEvidence
  readonly source?: ExplainEvidence
  readonly fields?: Readonly<Record<string, ExplainField>>
}

type ExplainResource = {
  readonly name: string
  readonly fields?: Readonly<Record<string, ExplainField>>
}

type ExplainModel = {
  readonly name: string
}

type ExplainRoute = {
  readonly name: string
  readonly response?: ExplainField
}

type ExplainGraph = {
  readonly resources?: readonly ExplainResource[]
  readonly models?: readonly ExplainModel[]
  readonly routes?: readonly ExplainRoute[]
}

const readGraph = (graphPath: string): ExplainGraph =>
  JSON.parse(fs.readFileSync(graphPath, 'utf8')) as ExplainGraph

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

      const graph = readGraph(graphPath)
      const parts = fieldPath.split('.')

      let targetObj: ExplainResource | ExplainModel | ExplainRoute | undefined
      let targetType: 'resource' | 'model' | 'route' | undefined
      let remainingParts: string[] = []

      const resource = graph.resources?.find((candidate) => candidate.name === parts[0])
      if (resource) {
        targetObj = resource
        targetType = 'resource'
        remainingParts = parts.slice(1)
      } else {
        const model = graph.models?.find((candidate) => candidate.name === parts[0])
        if (model) {
          targetObj = model
          targetType = 'model'
          remainingParts = parts.slice(1)
        } else {
          const routes = graph.routes ?? []
          for (let i = 1; i <= parts.length; i += 1) {
            const potentialName = parts.slice(0, i).join('.')
            const route = routes.find((candidate) => candidate.name === potentialName)
            if (route) {
              targetType = 'route'
              targetObj = route
              remainingParts = parts.slice(i)
              break
            }
          }
        }
      }

      if (!targetObj || !targetType) {
        console.error(chalk.red(`Could not find Resource, Model, or Route matching prefix in path: ${fieldPath}`))
        process.exit(1)
      }

      let current: ExplainField | undefined

      if (targetType === 'resource') {
        current = { kind: 'object', fields: targetObj.fields }
      } else if (targetType === 'model') {
        console.error(chalk.yellow('Explanation for direct models is not fully supported yet.'))
        process.exit(1)
      } else {
        current = targetObj.response
        if (!current && remainingParts.length > 0) {
          console.error(chalk.red(`Route ${targetObj.name} has no response metadata extracted.`))
          process.exit(1)
        }
      }

      for (const part of remainingParts) {
        if (!current) break
        current = current.kind === 'object' && current.fields
          ? current.fields[part]
          : undefined
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
      console.log(resolvedType === 'unknown' ? chalk.yellow(resolvedType) : chalk.green(resolvedType))
      console.log('')

      console.log(chalk.bold('Evidence:'))
      const evidence = current.evidence ?? current.provenance ?? current.source
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(chalk.red(`Error: ${message}`))
      process.exit(1)
    }
  })
