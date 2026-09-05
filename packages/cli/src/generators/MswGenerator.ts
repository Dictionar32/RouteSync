import { RouteManifest, matchResponseShape, getRouteContract } from '@routesync/core'
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

      const dataExpression = route.response
        ? matchResponseShape(route.response.shape, {
            collection: () => '[]',
            paginated: () => '[]',
            single: () => '{ id: 1, ...params }'
          })
        : '{ id: 1, ...params }'

      const contract = route.contract ?? getRouteContract(route)
      if (contract?.provenance) {
        lines.push(`  /**`)
        lines.push(`   * @provenance ${contract.provenance.summary}`)
        if (contract.provenance.route?.file) {
          lines.push(`   * @see ${contract.provenance.route.file}#L${contract.provenance.route.line}`)
        }
        lines.push(`   */`)
      }

      lines.push('  http.' + mswMethod + '(\'' + mswPath + '\', async ({ request, params }) => {')
      lines.push(`    await delay(300) // Simulated network latency`)
      lines.push(`    const url = new URL(request.url)`)
      lines.push(`    return HttpResponse.json({`)
      lines.push(`      success: true,`)
      lines.push(`      message: 'Mocked response for ${actionName} at ' + url.pathname,`)
      lines.push(`      data: ${dataExpression}`)
      lines.push(`    })`)
      lines.push(`  }),`)
    }

    lines.push(`]`)

    await fs.writeFile(path.join(outputDir, 'mocks.ts'), lines.join('\n'))
  }
}
