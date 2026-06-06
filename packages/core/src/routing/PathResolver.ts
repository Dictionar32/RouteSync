export class PathResolver {
  /**
   * Resolve path params.
   * e.g. resolvePath('/produk/:id', { id: 10 }) => '/produk/10'
   */
  static resolve(path: string | Function, params?: Record<string, any>): string {
    if (typeof path === 'function') {
      const fnStr = path.toString().replace(/[\r\n\s]+/g, ' ')
      let paramsStr = ''
      const arrowMatch = fnStr.match(/^\s*\(?([^)]*)\)?\s*=>/)
      if (arrowMatch) {
        paramsStr = arrowMatch[1]
      } else {
        const funcMatch = fnStr.match(/^\s*function\s*\(?([^)]*)\)?/)
        if (funcMatch) {
          paramsStr = funcMatch[1]
        }
      }
      const paramNames = paramsStr
        .split(',')
        .map(p => p.trim().split(':')[0].trim().split('=')[0].trim())
        .filter(Boolean)

      const args = paramNames.map(name => params ? params[name] : undefined)
      return path(...args)
    }

    if (!params) return path

    let resolved = path

    for (const [key, value] of Object.entries(params)) {
      resolved = resolved.replace(`:${key}`, String(value))
    }

    // Check for unresolved params
    const unresolved = resolved.match(/:([a-zA-Z_]+)/g)
    if (unresolved) {
      throw new Error(
        `Unresolved path params: ${unresolved.join(', ')}`
      )
    }

    return resolved
  }

  static extractParams(path: string | Function): string[] {
    if (typeof path === 'function') {
      const fnStr = path.toString().replace(/[\r\n\s]+/g, ' ')
      let paramsStr = ''
      const arrowMatch = fnStr.match(/^\s*\(?([^)]*)\)?\s*=>/)
      if (arrowMatch) {
        paramsStr = arrowMatch[1]
      } else {
        const funcMatch = fnStr.match(/^\s*function\s*\(?([^)]*)\)?/)
        if (funcMatch) {
          paramsStr = funcMatch[1]
        }
      }
      return paramsStr
        .split(',')
        .map(p => p.trim().split(':')[0].trim().split('=')[0].trim())
        .filter(Boolean)
    }
    const matches = path.match(/:([a-zA-Z_]+)/g) ?? []
    return matches.map((m) => m.slice(1))
  }

  static hasParams(path: string | Function): boolean {
    if (typeof path === 'function') {
      return PathResolver.extractParams(path).length > 0
    }
    return /:([a-zA-Z_]+)/.test(path)
  }
}
