import { RouteManifest } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'
import { classifyRoutes } from './route-classifier'

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

    const classified = classifyRoutes(manifest.routes)

    const grouped: Record<string, typeof classified> = {}
    for (const route of classified) {
      if (!grouped[route.groupName]) {
        grouped[route.groupName] = []
      }
      grouped[route.groupName].push(route)
    }

    for (const [groupName, routes] of Object.entries(grouped)) {
      for (const route of routes) {
        const TitleCaseAction = route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1)
        const actionFnName = `${groupName}${TitleCaseAction}Action`

        const pathParams = Array.from(route.runtimePath.matchAll(/:([a-zA-Z0-9_]+)/g)).map(m => m[1])
        const hasParams = pathParams.length > 0
        const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method)
          && route.raw.schema?.rules
          && Object.keys(route.raw.schema.rules).length > 0
        const hasQuery = route.method === 'GET' || route.method === 'DELETE'

        const requiresPayload = hasParams || hasBody || hasQuery
        const payloadRequired = hasParams || hasBody
        
        const fnParam = requiresPayload
          ? `payload${payloadRequired ? '' : '?'}: Parameters<typeof api.${groupName}.${route.actionName}>[0]`
          : ''

        const callArgs: string[] = []
        if (hasParams) callArgs.push(`params: payload.params`)
        if (hasQuery) callArgs.push(`query: payload?.query`)
        if (hasBody) callArgs.push(`body: payload.body`)
        if (route.raw.auth) callArgs.push(`headers: await getAuthHeaders()`)

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

    await fs.writeFile(path.join(outputDir, 'actions.ts'), lines.join('\n'))
  }
}
