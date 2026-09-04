import { RouteManifest } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'
import { toMethodName } from './names'

export class MswGenerator {
  static async generate(manifest: RouteManifest, outputDir: string): Promise<void> {
    const lines: string[] = []

    lines.push(`// Auto-generated MSW Mocks. Do not edit manually.`)
    lines.push(`import { http, HttpResponse, delay } from 'msw'`)
    lines.push(``)
    lines.push(`export const handlers = [`)

    for (const route of manifest.routes) {
      const mswMethod = route.method.toLowerCase()
      const runtimePath = route.runtimePath || route.path
      const mswPath = manifest.baseURL + (runtimePath.startsWith('/') ? runtimePath : '/' + runtimePath)
      const actionName = toMethodName(route)
      const isCollection = route.response?.shape === 'collection' || route.response?.shape === 'paginated'
      const readType = route.response?.readTypeName

      lines.push('  http.' + mswMethod + '(\'' + mswPath + '\', async ({ request, params }) => {')
      lines.push(`    await delay(300) // Simulated network latency`)
      lines.push(`    const url = new URL(request.url)`)
      lines.push(`    return HttpResponse.json({`)
      lines.push(`      success: true,`)
      lines.push(`      message: 'Mocked response for ${actionName} at ' + url.pathname,`)
      if (isCollection) {
        lines.push(`      data: []`)
      } else {
        lines.push(`      data: { id: 1, ...params }`)
      }
      lines.push(`    })`)
      lines.push(`  }),`)
    }

    lines.push(`]`)

    await fs.writeFile(path.join(outputDir, 'mocks.ts'), lines.join('\n'))
  }
}
