import fs from 'fs-extra'
import { ParsedRoute } from '@routesync/core'

export class OpenApiParser {
  async parse(filePath: string): Promise<ParsedRoute[]> {
    const spec = await fs.readJson(filePath)
    return this.parseSpec(spec)
  }

  parseSpec(spec: Record<string, unknown>): ParsedRoute[] {
    const routes: ParsedRoute[] = []
    const paths = (spec.paths as Record<string, unknown>) ?? {}

    for (const [path, methods] of Object.entries(paths)) {
      if (methods && typeof methods === 'object') {
        for (const [method, operation] of Object.entries(methods as Record<string, unknown>)) {
          if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
            const op = operation as Record<string, unknown>
            const auth = Object.keys(op.security as Record<string, unknown> ?? {}).length > 0

            routes.push({
              name: (op.operationId as string) ?? `${method}.${path}`,
              method: method.toUpperCase(),
              path,
              auth,
              middleware: []
            })
          }
        }
      }
    }

    return routes
  }
}
