import { RouteManifest } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'
import { buildGeneratedRoutes, toTypeName } from './names'

export class NextActionGenerator {
  static async generate(manifest: RouteManifest, outputDir: string): Promise<void> {
    const lines: string[] = []

    lines.push(`// Auto-generated Next.js Server Actions. Do not edit manually.`)
    lines.push(`"use server";`)
    lines.push(``)
    lines.push(`import { api } from './api'`)
    lines.push(`import { cookies } from 'next/headers'`)
    lines.push(``)
    
    lines.push(`// Helper to auto-inject token from cookies if available`)
    lines.push(`async function getAuthHeaders(): Promise<Record<string, string> | undefined> {`)
    lines.push(`  const cookieStore = await cookies()`)
    lines.push(`  const token = cookieStore.get('token')?.value`)
    lines.push(`  return token ? { Authorization: \`Bearer \${token}\` } : undefined`)
    lines.push(`}`)
    lines.push(``)

    const grouped = buildGeneratedRoutes(manifest.routes)
    const usedContracts = new Set<string>()

    for (const [groupName, routes] of Object.entries(grouped)) {
      for (const route of routes) {
        const actionName = `${groupName}${toTypeName(route.actionName)}`
        const TitleCaseGroup = groupName.charAt(0).toUpperCase() + groupName.slice(1)
        const TitleCaseAction = route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1)
        const ContractName = `${TitleCaseGroup}${TitleCaseAction}Contract`
        
        const hasBody = route.schema && route.schema.rules && Object.keys(route.schema.rules).length > 0
        const hasQuery = route.method === 'GET'
        const hasParams = route.path.includes('{')
        
        const count = (hasBody ? 1 : 0) + (hasQuery ? 1 : 0) + (hasParams ? 1 : 0)
        
        let payloadParam = ''
        const args: string[] = []

        if (count > 1) {
          usedContracts.add(ContractName)
          const props: string[] = []
          if (hasParams) { props.push(`params: ${ContractName}['request']['params']`); args.push(`params: payload.params`) }
          if (hasQuery) { props.push(`query?: ${ContractName}['request']['query']`); args.push(`query: payload.query`) }
          if (hasBody) { props.push(`body: ${ContractName}['request']['body']`); args.push(`body: payload.body`) }
          payloadParam = `payload: { ${props.join(', ')} }`
        } else if (count === 1) {
          usedContracts.add(ContractName)
          if (hasParams) { payloadParam = `payload: ${ContractName}['request']['params']`; args.push(`params: payload`) }
          if (hasQuery) { payloadParam = `payload?: ${ContractName}['request']['query']`; args.push(`query: payload`) }
          if (hasBody) { payloadParam = `payload: ${ContractName}['request']['body']`; args.push(`body: payload`) }
        } else {
          payloadParam = ''
        }

        lines.push(`export async function ${actionName}Action(${payloadParam}) {`)
        
        if (route.auth) {
          args.push(`headers: await getAuthHeaders()`)
        }
        
        const argsString = args.length > 0 ? `{ ${args.join(', ')} }` : ''
        const apiCall = `await api.${groupName}.${route.actionName}(${argsString})`
        
        lines.push(`  try {`)
        lines.push(`    const response = ${apiCall}`)
        lines.push(`    return { success: true, data: response }`)
        lines.push(`  } catch (error: unknown) {`)
        lines.push(`    return { success: false, error: error instanceof Error ? error.message : String(error) }`)
        lines.push(`  }`)
        lines.push(`}`)
        lines.push(``)
      }
    }

    // Add import for contracts at the top
    const contractsToImport = Array.from(usedContracts)
    const importStr = contractsToImport.length > 0 
      ? `import { api, type ${contractsToImport.join(', type ')} } from './api'` 
      : `import { api } from './api'`
    lines.splice(3, 1, importStr)

    await fs.writeFile(path.join(outputDir, 'actions.ts'), lines.join('\n'))
  }
}
