import { RouteManifest, RoutePayloadMode, matchRoutePayloadMode } from '@routesync/core'
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

    const classified = classifyRoutes(manifest.routes, manifest.frontend?.groupAliases)

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

        const pathParams = route.raw.pathParameters ? route.raw.pathParameters.map(p => p.propertyName) : []
        const hasParams = pathParams.length > 0
        const hasBody = Boolean(
          (route.raw.requestContentType && route.raw.requestContentType !== 'none') ||
          (route.raw.isMutating && route.raw.schema && route.raw.schema.rules)
        )
        const hasQuery = Boolean(
          (route.raw.queryParameters && route.raw.queryParameters.length > 0) ||
          route.method === 'GET' ||
          route.method === 'DELETE'
        )

        // 1. Authoritative payload mode from executionSignature SSOT
        const effectivePayloadMode = route.raw.executionSignature
          ? route.raw.executionSignature.payloadMode
          : (hasParams || hasBody ? RoutePayloadMode.Required : (hasQuery ? RoutePayloadMode.Optional : RoutePayloadMode.None))

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
        switch (Boolean(route.raw.auth)) {
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
