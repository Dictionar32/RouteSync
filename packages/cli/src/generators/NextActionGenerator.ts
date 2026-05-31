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

    for (const [groupName, routes] of Object.entries(grouped)) {
      for (const route of routes) {
        const actionName = `${groupName}${toTypeName(route.actionName)}`
        lines.push(`export async function ${actionName}Action(payload?: Record<string, unknown>) {`)
        
        const args: string[] = []
        if (route.path.includes(':')) {
          args.push(`params: payload as any`)
        }
        
        if (route.method === 'GET') {
          args.push(`query: payload`)
        } else {
          args.push(`body: payload`)
        }
        
        if (route.auth) {
          args.push(`headers: await getAuthHeaders()`)
        }
        
        const apiCall = `await api.${groupName}.${route.actionName}({ ${args.join(', ')} })`
        
        lines.push(`  try {`)
        lines.push(`    const response = ${apiCall}`)
        lines.push(`    return { success: true, data: response.data }`)
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
