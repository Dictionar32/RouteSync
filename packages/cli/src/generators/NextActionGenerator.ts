import { RouteManifest, RoutePayloadMode, matchRoutePayloadMode } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'
import { projectRoutes } from './route-capability-projection'

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

    const classified = projectRoutes(manifest.routes, manifest.frontend?.groupAliases)

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

        const pathParams = route.identity.parameters.path
        const hasParams = pathParams.length > 0
        const hasBody = route.capability.requestContentType !== 'none'
        const hasQuery = route.identity.parameters.query.length > 0 || route.capability.actionKind === 'read' || route.capability.actionKind === 'delete'

        // Canonical payload mode from the upstream execution-signature contract.
        const effectivePayloadMode = route.capability.executionSignature.payloadMode

        const callArgs: string[] = []
        switch (hasParams) {
          case true:
            callArgs.push(`params: payload.params`)
            break;
          case false:
            break;
        }
        switch (hasQuery) {
          case true:
            callArgs.push(`query: payload?.query`)
            break;
          case false:
            break;
        }
        switch (hasBody) {
          case true:
            callArgs.push(`body: payload.body`)
            break;
          case false:
            break;
        }
        switch (route.capability.auth.value) {
          case true:
            callArgs.push(`headers: await getAuthHeaders()`)
            break;
          case false:
            break;
        }

        const argsStr = callArgs.length > 0 ? `{ ${callArgs.join(', ')} }` : ''

        matchRoutePayloadMode(effectivePayloadMode, {
          none: () => {
            lines.push(`export async function ${actionFnName}() {`)
          },
          required: () => {
            lines.push(`export async function ${actionFnName}(payload: Parameters<typeof api.${groupName}.${route.actionName}>[0]) {`)
          },
          optional: () => {
            lines.push(`export async function ${actionFnName}(payload?: Parameters<typeof api.${groupName}.${route.actionName}>[0]) {`)
          }
        })

        lines.push(`  try {`)
        lines.push(`    const data = await api.${groupName}.${route.actionName}(${argsStr})`)
        lines.push(`    return { success: true, data }`)
        lines.push(`  } catch (error: unknown) {`)
        lines.push(`    const message = error instanceof Error ? error.message : String(error)`)
        lines.push(`    return { success: false, error: message }`)
        lines.push(`  }`)
        lines.push(`}`)
        lines.push(``)
      }
    }

    await fs.writeFile(path.join(outputDir, 'actions.ts'), lines.join('\n'))
  }
}
