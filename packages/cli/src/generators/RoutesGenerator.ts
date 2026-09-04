import { RouteManifest, PageEndpointKind, PAGE_ENDPOINT_REGISTRY, matchPageEndpoint, PageEndpointDescriptor } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'

function findNodeModulesRouteSync(outputDir: string): string | null {
  let current = path.resolve(outputDir)
  while (true) {
    const target = path.join(current, 'node_modules', 'routesync')
    if (fs.existsSync(target)) {
      return target
    }
    const parent = path.dirname(current)
    if (parent === current) {
      break
    }
    current = parent
  }
  return null
}

export interface ScannedPageEndpointParams {
  readonly path: string
  readonly query: readonly string[]
  readonly params: readonly string[]
  readonly kind?: PageEndpointKind
}

/**
 * Reusable Constructor: Scanned Page Endpoint Descriptor.
 */
export class ScannedPageEndpointDescriptor implements PageEndpointDescriptor {
  public readonly kind: PageEndpointKind
  public readonly path: string
  public readonly query: readonly string[]
  public readonly params: readonly string[]

  constructor(params: ScannedPageEndpointParams);
  constructor(params: { readonly path: string; readonly query?: readonly string[]; readonly params?: readonly string[]; readonly kind?: PageEndpointKind });
  constructor({ path, query = [], params = [], kind }: { readonly path: string; readonly query?: readonly string[]; readonly params?: readonly string[]; readonly kind?: PageEndpointKind }) {
    this.path = path
    this.query = Object.freeze([...query])
    this.params = Object.freeze([...params])
    this.kind = kind ?? (this.query.length > 0 ? PageEndpointKind.QueryFiltered : (this.params.length > 0 ? PageEndpointKind.Parameterized : PageEndpointKind.Static))
    Object.freeze(this)
  }

  public static static(path: string): ScannedPageEndpointDescriptor {
    return new ScannedPageEndpointDescriptor({
      path,
      query: [],
      params: [],
      kind: PageEndpointKind.Static
    })
  }

  public static parameterized(path: string, params: readonly string[]): ScannedPageEndpointDescriptor {
    return new ScannedPageEndpointDescriptor({
      path,
      query: [],
      params,
      kind: PageEndpointKind.Parameterized
    })
  }

  public static queryFiltered(path: string, query: readonly string[], params: readonly string[] = []): ScannedPageEndpointDescriptor {
    return new ScannedPageEndpointDescriptor({
      path,
      query,
      params,
      kind: PageEndpointKind.QueryFiltered
    })
  }

  public static create(params: { readonly path: string; readonly query?: readonly string[]; readonly params?: readonly string[]; readonly kind?: PageEndpointKind }): ScannedPageEndpointDescriptor {
    return new ScannedPageEndpointDescriptor({
      path: params.path,
      query: params.query ?? [],
      params: params.params ?? [],
      kind: params.kind
    })
  }

  public static simple(path: string): ScannedPageEndpointDescriptor {
    return ScannedPageEndpointDescriptor.static(path)
  }
}

export class RoutesGenerator {
  static async generate(manifest: RouteManifest, outputDir: string): Promise<boolean> {
    try {
      if (!manifest.pages || typeof manifest.pages !== 'object') {
        return false
      }

      const sdkDir = findNodeModulesRouteSync(outputDir) || outputDir
      const distDir = sdkDir === outputDir ? outputDir : path.join(sdkDir, 'dist')

      const routeTree: any = {}

      for (const [key, value] of Object.entries(manifest.pages)) {
        const segments = key.split('.')
        let current = routeTree
        for (let i = 0; i < segments.length - 1; i++) {
          const seg = segments[i]
          if (!current[seg]) {
            current[seg] = {}
          }
          current = current[seg]
        }
        const lastSeg = segments[segments.length - 1]

        let pagePath = ''
        let queryKeys: string[] = []
        if (typeof value === 'string') {
          pagePath = value
        } else if (value && typeof value === 'object') {
          const val = value as Record<string, unknown>
          pagePath = (val.path as string) || ''
          queryKeys = (val.query as string[]) || []
        }

        const params: string[] = []
        const paramRegex = /\{([^}]+)\}|:([a-zA-Z0-9_]+)/g
        let match
        while ((match = paramRegex.exec(pagePath)) !== null) {
          params.push(match[1] || match[2])
        }

        current[lastSeg] = queryKeys.length > 0
          ? ScannedPageEndpointDescriptor.queryFiltered(pagePath, queryKeys, params)
          : (params.length > 0
              ? ScannedPageEndpointDescriptor.parameterized(pagePath, params)
              : ScannedPageEndpointDescriptor.static(pagePath))
      }

      const serializeTree = (tree: any, indent: string = '  '): { js: string[], dts: string[] } => {
        const jsLines: string[] = []
        const dtsLines: string[] = []
        
        for (const [key, val] of Object.entries(tree)) {
          if (val instanceof ScannedPageEndpointDescriptor || (val && typeof val === 'object' && 'path' in val)) {
            const page = val as ScannedPageEndpointDescriptor
            const rendered = matchPageEndpoint(page, {
              static: (p) => ({
                js: `${indent}${key}: '${p.path}',`,
                dts: `${indent}readonly ${key}: '${p.path}';`
              }),
              parameterized: (p) => {
                const signature = `(params: { ${p.params.map(k => `${k}: string | number | null`).join('; ')} })`
                return {
                  js: `${indent}${key}: (params) => PathResolver.resolveUrl('${p.path}', params),`,
                  dts: `${indent}readonly ${key}: ${signature} => string;`
                }
              },
              query_filtered: (p) => {
                const allKeys = [...p.params, ...p.query]
                const signature = `(params: { ${allKeys.map(k => `${k}${p.query.includes(k) ? '?:' : ':'} string | number | null`).join('; ')} })`
                return {
                  js: `${indent}${key}: (params) => PathResolver.resolveUrl('${p.path}', params),`,
                  dts: `${indent}readonly ${key}: ${signature} => string;`
                }
              }
            })
            jsLines.push(rendered.js)
            dtsLines.push(rendered.dts)
          } else {
            jsLines.push(`${indent}${key}: {`)
            dtsLines.push(`${indent}readonly ${key}: {`)
            
            const sub = serializeTree(val, indent + '  ')
            jsLines.push(...sub.js)
            dtsLines.push(...sub.dts)
            
            jsLines.push(`${indent}},`)
            dtsLines.push(`${indent}};`)
          }
        }
        return { js: jsLines, dts: dtsLines }
      }

      const tree = serializeTree(routeTree)

      // Write JS file
      const jsContent = [
        `const { PathResolver } = require('./core.js');`,
        `const routes = {`,
        ...tree.js,
        `};`,
        `exports.routes = routes;`
      ].join('\n')

      // Write DTS file
      const dtsContent = [
        `import { PathResolver } from './core';`,
        `export declare const routes: {`,
        ...tree.dts,
        `};`
      ].join('\n')

      await fs.ensureDir(distDir)
      await fs.writeFile(path.join(distDir, 'routes.js'), jsContent)
      await fs.writeFile(path.join(distDir, 'routes.d.ts'), dtsContent)

      // Also clean up any legacy routes.ts in the output directory if it exists
      const legacyPath = path.join(outputDir, 'routes.ts')
      if (await fs.pathExists(legacyPath)) {
        await fs.remove(legacyPath)
      }

      return true
    } catch (e) {
      console.error('Failed to generate routes:', e)
      return false
    }
  }
}
