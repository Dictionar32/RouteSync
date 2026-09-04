import { RouteManifest, RouteParameterType, ROUTE_PARAMETER_TYPE_REGISTRY, ValidationRuleKind } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'

export class ConstantsGenerator {
  static getRouteKey(routePath: string): string {
    const cleanPath = routePath.replace(/^\/|\/$/g, '')
    const segments = cleanPath.split('/')
    
    const keySegments: string[] = []
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      if ((seg.startsWith('{') && seg.endsWith('}')) || seg.startsWith(':')) {
        const paramName = seg.startsWith(':') ? seg.slice(1) : seg.slice(1, -1)
        if (paramName.toLowerCase() === 'id') {
          keySegments.push('DETAIL')
        } else {
          let processed = false
          if (keySegments.length > 0) {
            const lastIdx = keySegments.length - 1
            if (keySegments[lastIdx].endsWith('S')) {
              keySegments[lastIdx] = keySegments[lastIdx].slice(0, -1) // e.g. ITEMS -> ITEM
              processed = true
            }
          }
          if (!processed) {
            const cleanParam = paramName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()
            keySegments.push(cleanParam)
          }
        }
      } else {
        keySegments.push(seg.toUpperCase().replace(/[^A-Z0-9]/g, '_'))
      }
    }
    return keySegments.filter(Boolean).join('_')
  }

  static getConstantLines(manifest: RouteManifest): string[] {
    const lines: string[] = []
    lines.push(``)
    lines.push(`/* =========================`)
    lines.push(`   APPLICATION CONSTANTS`)
    lines.push(`========================= */`)
    lines.push(``)

    // 1. API_URL
    const defaultBaseURL = manifest.baseURL || 'http://localhost/api'
    lines.push(`export const API_URL = process.env.NEXT_PUBLIC_API_URL || '${defaultBaseURL}'`)
    lines.push(``)

    // 2. API_ENDPOINTS
    const uniqueRoutesMap = new Map<string, any>()
    for (const route of manifest.routes) {
      if (!uniqueRoutesMap.has(route.path)) {
        uniqueRoutesMap.set(route.path, route)
      }
    }

    const uniqueRoutes = Array.from(uniqueRoutesMap.values())
    uniqueRoutes.sort((a, b) => a.path.localeCompare(b.path))

    const routeKeys = uniqueRoutes.map(route => {
      const endpointKey = ConstantsGenerator.getRouteKey(route.path)
      return { route, endpointKey }
    })

    lines.push(`export const API_ENDPOINTS = {`)
    for (const { route, endpointKey } of routeKeys) {
      let pathParams: Array<{ name: string; propertyName: string; type: string }> = (route.pathParameters ?? []).map(p => ({
        name: p.name,
        propertyName: p.propertyName,
        type: ROUTE_PARAMETER_TYPE_REGISTRY[p.type].tsType
      }))

      if (pathParams.length === 0) {
        const matches = [...route.path.matchAll(/\{([^}]+)\}/g)]
        if (matches.length > 0) {
          pathParams = matches.map(m => {
            const rawParam = m[1].split(':')[0]
            return {
              name: rawParam,
              propertyName: rawParam,
              type: 'string | number'
            }
          })
        }
      }

      let normalizedPath = route.runtimePath || route.path
      if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath
      }

      if (pathParams.length > 0) {
        let bodyTemplate = normalizedPath
        for (const p of pathParams) {
          if (bodyTemplate.includes(`:${p.name}`)) {
            bodyTemplate = bodyTemplate.split(`:${p.name}`).join('${' + p.propertyName + '}')
          } else if (bodyTemplate.includes(`{${p.name}}`)) {
            bodyTemplate = bodyTemplate.split(`{${p.name}}`).join('${' + p.propertyName + '}')
          }
        }
        if (!bodyTemplate.startsWith('/')) {
          bodyTemplate = '/' + bodyTemplate
        }

        const argsStr = pathParams.map(p => `${p.propertyName}: ${p.type}`).join(', ')
        lines.push(`  ${endpointKey}: (${argsStr}) => \`${bodyTemplate}\`,`)
      } else {
        lines.push(`  ${endpointKey}: '${normalizedPath}',`)
      }
    }
    lines.push(`} as const`)
    lines.push(``)

    // 3. ROUTES
    lines.push(`export const ROUTES = {`)
    lines.push(`  HOME: '/',`)

    const addedRoutes = new Set<string>()
    addedRoutes.add('/')

    const getRoutes = manifest.routes.filter(r => r.method.toUpperCase() === 'GET')
    for (const route of getRoutes) {
      const cleanPath = route.path.replace(/^\/|\/$/g, '')
      if (!cleanPath || addedRoutes.has('/' + cleanPath)) continue

      const segments = cleanPath.split('/')
      const routeKey = segments.map(s => {
        if ((s.startsWith('{') && s.endsWith('}')) || s.startsWith(':')) {
          return 'DETAIL'
        }
        return s.toUpperCase().replace(/[^A-Z0-9]/g, '_')
      }).filter(Boolean).join('_')

      let pathParams: Array<{ name: string; propertyName: string; type: string }> = (route.pathParameters ?? []).map(p => ({
        name: p.name,
        propertyName: p.propertyName,
        type: ROUTE_PARAMETER_TYPE_REGISTRY[p.type].tsType
      }))

      if (pathParams.length === 0) {
        const matches = [...route.path.matchAll(/\{([^}]+)\}/g)]
        if (matches.length > 0) {
          pathParams = matches.map(m => {
            const rawParam = m[1].split(':')[0]
            return {
              name: rawParam,
              propertyName: rawParam,
              type: 'string | number'
            }
          })
        }
      }

      if (pathParams.length > 0) {
        let bodyTemplate = route.runtimePath || route.path
        for (const p of pathParams) {
          if (bodyTemplate.includes(`:${p.name}`)) {
            bodyTemplate = bodyTemplate.split(`:${p.name}`).join('${' + p.propertyName + '}')
          } else if (bodyTemplate.includes(`{${p.name}}`)) {
            bodyTemplate = bodyTemplate.split(`{${p.name}}`).join('${' + p.propertyName + '}')
          }
        }
        if (!bodyTemplate.startsWith('/')) {
          bodyTemplate = '/' + bodyTemplate
        }
        const argsStr = pathParams.map(p => `${p.propertyName}: ${p.type}`).join(', ')
        lines.push(`  ${routeKey}: (${argsStr}) => \`${bodyTemplate}\`,`)
      } else {
        lines.push(`  ${routeKey}: '/${cleanPath}',`)
      }
      addedRoutes.add('/' + cleanPath)
    }
    lines.push(`} as const`)
    lines.push(``)

    // 4. Status Enums (Extracted from manifest models columns & validation rules)
    const enumGroups: Record<string, Record<string, string[]>> = {}
    const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)
    const camelCase = (s: string): string => s.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())

    const addEnum = (group: string, field: string, values: string[]) => {
      const cleanGroup = capitalize(camelCase(group))
      const cleanField = capitalize(camelCase(field))
      if (!enumGroups[cleanGroup]) {
        enumGroups[cleanGroup] = {}
      }
      const existing = enumGroups[cleanGroup][cleanField] || []
      const merged = Array.from(new Set([...existing, ...values]))
      enumGroups[cleanGroup][cleanField] = merged
    }

    if (manifest.models && Array.isArray(manifest.models)) {
      for (const model of manifest.models) {
        if (!model.columns || !Array.isArray(model.columns)) continue

        for (const col of model.columns) {
          const type = col.type.toLowerCase()
          const enumMatch = type.match(/^enum\((.*)\)$/)
          if (enumMatch && enumMatch[1]) {
            const values = enumMatch[1].split(',').map(v => v.trim().replace(/^'|'$/g, ""))
            addEnum(model.name, col.name, values)
          }
        }
      }
    }

    if (manifest.routes && Array.isArray(manifest.routes)) {
      for (const route of manifest.routes) {
        if (!route.schema?.rules) continue
        const group = route.groupName || 'App'
        if (Array.isArray(route.schema.rules)) {
          for (const ruleEntry of route.schema.rules) {
            const field = ruleEntry.fieldName
            const inRule = ruleEntry.ast?.find((r: any) => r.kind === ValidationRuleKind.In)
            if (inRule && inRule.kind === ValidationRuleKind.In && inRule.values && inRule.values.length > 0) {
              addEnum(group, field, [...inRule.values])
            }
          }
        } else {
          const rules = route.schema.rules as Record<string, unknown>
          for (const [field, ruleVal] of Object.entries(rules)) {
            const ruleStr = String(ruleVal)
            const match = ruleStr.match(/\bin:([a-zA-Z0-9_,-]+)/)
            if (match && match[1]) {
              const values = match[1].split(',').map(v => v.trim())
              addEnum(group, field, values)
            }
          }
        }
      }
    }

    if (Object.keys(enumGroups).length > 0) {
      lines.push(`export const Enums = {`)
      for (const [group, fields] of Object.entries(enumGroups)) {
        lines.push(`  ${group}: {`)
        for (const [field, values] of Object.entries(fields)) {
          lines.push(`    ${field}: {`)
          for (const val of values) {
            const key = val.toUpperCase().replace(/[^A-Z0-9]/g, '_')
            lines.push(`      ${key}: '${val}',`)
          }
          lines.push(`    } as const,`)
        }
        lines.push(`  },`)
      }
      lines.push(`} as const`)
      lines.push(``)

      for (const [group, fields] of Object.entries(enumGroups)) {
        for (const [field, values] of Object.entries(fields)) {
          const typeName = `${group}${field}`
          lines.push(`export type ${typeName} = (typeof Enums.${group}.${field})[keyof typeof Enums.${group}.${field}]`)
        }
      }
      lines.push(``)
    }

    return lines
  }

  static async generate(manifest: RouteManifest, outputDir: string): Promise<void> {
    const lines = ConstantsGenerator.getConstantLines(manifest)
    lines.unshift(`// Auto-generated by routesync. Do not edit manually.`)
    await fs.writeFile(path.join(outputDir, 'constants.ts'), lines.join('\n'))

    // Clean up any legacy enums.js or enums.d.ts inside node_modules if it exists
    const sdkDir = path.resolve(outputDir, '../../node_modules/routesync')
    if (fs.existsSync(sdkDir)) {
      const enumsJs = path.join(sdkDir, 'dist', 'enums.js')
      const enumsDts = path.join(sdkDir, 'dist', 'enums.d.ts')
      if (fs.existsSync(enumsJs)) await fs.remove(enumsJs)
      if (fs.existsSync(enumsDts)) await fs.remove(enumsDts)
    }
  }
}