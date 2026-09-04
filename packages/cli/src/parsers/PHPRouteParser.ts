import fs from 'fs-extra'
import { ParsedRoute, ScannedRouteDescriptor, HttpMethod } from '@routesync/core'

/**
 * Parser for simple native PHP routing patterns.
 * Supports patterns like:
 *   router('GET', '/users', callback)
 *   $router->get('/users', callback)
 */
export class PHPRouteParser {
  async parse(filePath: string): Promise<ParsedRoute[]> {
    const content = await fs.readFile(filePath, 'utf-8')
    return this.parseContent(content)
  }

  parseContent(content: string): ParsedRoute[] {
    const routes: ParsedRoute[] = []

    // Match $router->get/post/put/patch/delete patterns
    const arrowPattern = /\$router->(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/gi
    let match

    while ((match = arrowPattern.exec(content)) !== null) {
      const rawPath = match[2]
      const method = match[1].toUpperCase() as HttpMethod
      const cleanPath = rawPath.replace(/^\/api\/?/i, '').replace(/^\//, '')
      const resourceName = cleanPath.split('/')[0] || 'App'

      let actionKind: RouteActionKind = 'read'
      if (method === 'POST') {
        actionKind = 'create'
      } else if (method === 'PUT' || method === 'PATCH') {
        actionKind = 'update'
      } else if (method === 'DELETE') {
        actionKind = 'delete'
      }

      routes.push(new ScannedRouteDescriptor({
        method,
        path: rawPath,
        resourceName,
        actionName: method.toLowerCase(),
        actionKind,
        isMutating: method !== 'GET',
        auth: false,
        middleware: []
      }))
    }

    return routes
  }
}
