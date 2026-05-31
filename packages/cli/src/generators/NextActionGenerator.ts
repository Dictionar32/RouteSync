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
    lines.push(`IMPORT_PLACEHOLDER`)
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
        const TitleCaseGroup = groupName.charAt(0).toUpperCase() + groupName.slice(1)
        const TitleCaseAction = route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1)
        const ContractName = `${TitleCaseGroup}${TitleCaseAction}Contract`
        const actionFnName = `${groupName}${TitleCaseAction}Action`

        // Detect path params from runtimePath (:id, :provider, etc.)
        const pathParams = Array.from(route.runtimePath.matchAll(/:([a-zA-Z0-9_]+)/g)).map(m => m[1])
        const hasParams = pathParams.length > 0
        const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method)
          && route.schema?.rules
          && Object.keys(route.schema.rules).length > 0
        const hasQuery = route.method === 'GET'

        // Build function signature parts
        const sigParts: string[] = []
        if (hasParams) sigParts.push(`params: ${ContractName}['request']['params']`)
        if (hasQuery) sigParts.push(`query?: ${ContractName}['request']['query']`)
        if (hasBody) sigParts.push(`body?: ${ContractName}['request']['body']`)

        // Only import contract if it's actually used in the signature
        const needsContract = sigParts.length > 0
        if (needsContract) usedContracts.add(ContractName)

        // payload param — required if has path params, optional otherwise
        const fnParam = sigParts.length > 0
          ? `payload${hasParams ? '' : '?'}: { ${sigParts.join(', ')} }`
          : ''

        // Build api call args
        const callArgs: string[] = []
        if (hasParams) callArgs.push(`params: payload.params`)
        if (hasQuery) callArgs.push(`query: payload?.query`)
        if (hasBody) callArgs.push(`body: payload?.body`)
        if (route.auth) callArgs.push(`headers: await getAuthHeaders()`)

        // If the only arg is headers (auth-only, no params/body/query),
        // we must still pass it as an object so the call is valid.
        // The endpoint signature allows { headers } when TParams = unknown.
        const argsStr = callArgs.length > 0 ? `{ ${callArgs.join(', ')} }` : ''

        lines.push(`export async function ${actionFnName}(${fnParam}) {`)
        lines.push(`  try {`)
        lines.push(`    const data = await api.${groupName}.${route.actionName}(${argsStr})`)
        lines.push(`    return { success: true, data }`)
        lines.push(`  } catch (error: unknown) {`)
        lines.push(`    return { success: false, error: error instanceof Error ? error.message : String(error) }`)
        lines.push(`  }`)
        lines.push(`}`)
        lines.push(``)
      }
    }

    // Only import contracts that are actually referenced in function signatures
    const contractsToImport = Array.from(usedContracts)
    const importStr = contractsToImport.length > 0
      ? `import { api, type ${contractsToImport.join(', type ')} } from './api'`
      : `import { api } from './api'`

    const output = lines.join('\n').replace('IMPORT_PLACEHOLDER', importStr)
    await fs.writeFile(path.join(outputDir, 'actions.ts'), output)
  }
}
