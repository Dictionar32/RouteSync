import fs from 'fs-extra'
import { ParsedRoute } from '@routesync/core'

export class LaravelRouteParser {
  async parse(filePath: string): Promise<ParsedRoute[]> {
    const content = await fs.readFile(filePath, 'utf-8')
    return this.parseContent(content)
  }

  parseContent(content: string): ParsedRoute[] {
    const routes: ParsedRoute[] = []
    const lines = content.split('\n')

    let currentAuth = false
    let currentMiddleware: string[] = []
    let insideAuthGroup = false
    let insideAdminGroup = false
    let braceDepth = 0
    let groupBraceDepth = 0

    for (const line of lines) {
      const trimmed = line.trim()

      // Detect middleware groups
      if (trimmed.includes("middleware('auth:sanctum')")) {
        insideAuthGroup = true
        currentAuth = true
        groupBraceDepth = braceDepth
      }
      if (trimmed.includes("middleware(['auth:sanctum', 'admin'])")) {
        insideAdminGroup = true
        currentMiddleware = ['auth:sanctum', 'admin']
        groupBraceDepth = braceDepth
      }

      // Track brace depth
      braceDepth += (trimmed.match(/{/g) ?? []).length
      braceDepth -= (trimmed.match(/}/g) ?? []).length

      if (braceDepth <= groupBraceDepth && insideAuthGroup) {
        insideAuthGroup = false
        currentAuth = false
      }
      if (braceDepth <= groupBraceDepth && insideAdminGroup) {
        insideAdminGroup = false
        currentMiddleware = []
      }

      // Match Route:: lines
      const routeMatch = trimmed.match(
        /Route::(get|post|put|patch|delete|match)\(['"]([^'"]+)['"]/i
      )

      if (routeMatch) {
        const method = routeMatch[1].toUpperCase()
        const path = routeMatch[2]

        routes.push({
          name: this.inferName(method, path),
          method,
          path,
          auth: insideAuthGroup || insideAdminGroup,
          middleware: insideAdminGroup ? ['admin'] : []
        })
      }
    }

    return routes
  }

  private inferName(method: string, path: string): string {
    const parts = path.replace(/^\//, '').split('/')
    const resource = parts[0] ?? 'resource'
    const hasId = parts.some((p) => p.startsWith('{'))

    const map: Record<string, string> = {
      GET: hasId ? `${resource}.show` : `${resource}.index`,
      POST: `${resource}.store`,
      PUT: `${resource}.update`,
      PATCH: `${resource}.update`,
      DELETE: `${resource}.destroy`
    }

    return map[method] ?? `${resource}.action`
  }
}
