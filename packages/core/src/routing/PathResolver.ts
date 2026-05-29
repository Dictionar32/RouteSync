export class PathResolver {
  /**
   * Resolve path params.
   * e.g. resolvePath('/produk/:id', { id: 10 }) => '/produk/10'
   */
  static resolve(path: string, params?: Record<string, any>): string {
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

  static extractParams(path: string): string[] {
    const matches = path.match(/:([a-zA-Z_]+)/g) ?? []
    return matches.map((m) => m.slice(1))
  }

  static hasParams(path: string): boolean {
    return /:([a-zA-Z_]+)/.test(path)
  }
}
