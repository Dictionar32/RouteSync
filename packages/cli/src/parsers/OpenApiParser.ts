import fs from 'fs-extra'
import { ParsedRoute } from '@routesync/core'

export class OpenApiParser {
  async parse(filePath: string): Promise<ParsedRoute[]> {
    const spec = await fs.readJson(filePath)
    return this.parseSpec(spec)
  }

  parseSpec(spec: any): ParsedRoute[] {
    const routes: ParsedRoute[] = []
    const paths = spec.paths ?? {}

    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(methods as any)) {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          const op = operation as any
          const auth = Object.keys(op.security ?? {}).length > 0

          routes.push({
            name: op.operationId ?? `${method}.${path}`,
            method: method.toUpperCase(),
            path,
            auth,
            middleware: []
          })
        }
      }
    }

    return routes
  }
}
