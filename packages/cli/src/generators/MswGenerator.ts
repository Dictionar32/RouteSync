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
      // route.method is GET, POST, etc.
      // MSW uses http.get, http.post
      const mswMethod = route.method.toLowerCase()
      // route.path might have {id} or :id, MSW uses :id
      // toRuntimePath converts it to :id if it's not already
      // Wait, we need to apply toRuntimePath locally or import it.
      // Let's do a simple regex replace: /\{([^}/]+)\}/g -> ':$1'
      const mswPath = manifest.baseURL + route.path.replace(/\{([^}]+)\}/g, ':$1')
      const actionName = toMethodName(route)

      lines.push('  http.' + mswMethod + '(\'' + mswPath + '\', async ({ request: _request, params: _params }) => {')
      lines.push(`    await delay(300) // Simulated network latency`)
      lines.push(`    return HttpResponse.json({`)
      lines.push(`      success: true,`)
      lines.push(`      message: 'Mocked response for ${actionName}',`)
      lines.push(`      data: {} // TODO: Add mock data based on your schema`)
      lines.push(`    })`)
      lines.push(`  }),`)
    }

    lines.push(`]`)

    await fs.writeFile(path.join(outputDir, 'mocks.ts'), lines.join('\n'))
  }
}
