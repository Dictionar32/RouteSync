import fs from 'fs-extra'
import { ParsedRoute, ScannedRouteDescriptor, HttpMethod } from '@routesync/core'

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
            const auth = Object.keys((op.security as Record<string, unknown>) ?? {}).length > 0
            const upperMethod = method.toUpperCase() as HttpMethod
            const cleanPath = path.replace(/^\/api\/?/i, '').replace(/^\//, '')
            const resourceName = cleanPath.split('/')[0] || 'App'

            let actionKind: RouteActionKind = 'read'
            if (upperMethod === 'POST') {
              actionKind = 'create'
            } else if (upperMethod === 'PUT' || upperMethod === 'PATCH') {
              actionKind = 'update'
            } else if (upperMethod === 'DELETE') {
              actionKind = 'delete'
            }

            routes.push(new ScannedRouteDescriptor({
              method: upperMethod,
              path,
              resourceName,
              actionName: (op.operationId as string) || upperMethod.toLowerCase(),
              actionKind,
              isMutating: upperMethod !== 'GET',
              auth,
              middleware: []
            }))
          }
        }
      }
    }

    return routes
  }
}
