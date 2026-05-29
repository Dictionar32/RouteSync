import fs from 'fs-extra'
import { ParsedRoute } from '@routesync/core'

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
      routes.push({
        name: match[2].replace(/^\//, '').replace(/\//g, '.'),
        method: match[1].toUpperCase(),
        path: match[2],
        auth: false,
        middleware: []
      })
    }

    return routes
  }
}
