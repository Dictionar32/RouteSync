import { RouteManifest } from '@routesync/core'
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
    // deduplicate routes based on path and collect endpoints details
    const uniqueRoutesMap = new Map<string, any>()
    for (const route of manifest.routes) {
      if (!uniqueRoutesMap.has(route.path)) {
        uniqueRoutesMap.set(route.path, route)
      }
    }

    const uniqueRoutes = Array.from(uniqueRoutesMap.values())
    
    // Sort unique routes for consistent ordering
    uniqueRoutes.sort((a, b) => a.path.localeCompare(b.path))

    // Precompute keys and params to keep it DRY
    const routeKeys = uniqueRoutes.map(route => {
      const endpointKey = ConstantsGenerator.getRouteKey(route.path)
      return { route, endpointKey }
    })

    // Write API_ENDPOINTS
    lines.push(`export const API_ENDPOINTS = {`)
    for (const { route, endpointKey } of routeKeys) {
      const params: string[] = []
      let match
      const paramRegex = /\{([^}]+)\}|:([a-zA-Z0-9_]+)/g
      while ((match = paramRegex.exec(route.path)) !== null) {
        params.push(match[1] || match[2])
      }

      let normalizedPath = route.path.replace(/{([^}/]+)}/g, ':$1')
      if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath
      }

      if (params.length > 0) {
        let bodyTemplate = route.path
        for (const p of params) {
          bodyTemplate = bodyTemplate.replace(`{${p}}`, `\${${p}}`).replace(`:${p}`, `\${${p}}`)
        }
        if (!bodyTemplate.startsWith('/')) {
          bodyTemplate = '/' + bodyTemplate
        }

        const argsStr = params.map(p => `${p}: string | number`).join(', ')
        lines.push(`  ${endpointKey}: (${argsStr}) => \`${bodyTemplate}\`,`)
      } else {
        lines.push(`  ${endpointKey}: '${normalizedPath}',`)
      }
    }
    lines.push(`} as const`)
    lines.push(``)

    // 3. ROUTES (standard frontend navigation routes filtered from main GET routes)
    lines.push(`export const ROUTES = {`)
    lines.push(`  HOME: '/',`)

    const addedRoutes = new Set<string>()
    addedRoutes.add('/')

    // We look at all GET routes that don't have dynamic parameters
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

      const params: string[] = []
      let match
      const paramRegex = /\{([^}]+)\}|:([a-zA-Z0-9_]+)/g
      while ((match = paramRegex.exec(route.path)) !== null) {
        params.push(match[1] || match[2])
      }

      if (params.length > 0) {
        let bodyTemplate = route.path
        for (const p of params) {
          bodyTemplate = bodyTemplate.replace(`{${p}}`, `\${${p}}`).replace(`:${p}`, `\${${p}}`)
        }
        if (!bodyTemplate.startsWith('/')) {
          bodyTemplate = '/' + bodyTemplate
        }
        const argsStr = params.map(p => `${p}: string | number`).join(', ')
        lines.push(`  ${routeKey}: (${argsStr}) => \`${bodyTemplate}\`,`)
      } else {
        lines.push(`  ${routeKey}: '/${cleanPath}',`)
      }
      addedRoutes.add('/' + cleanPath)
    }
    lines.push(`} as const`)
    lines.push(``)

    // 4. Status Enums (Extracted from manifest models columns)
    if (manifest.models && Array.isArray(manifest.models)) {
      for (const model of manifest.models) {
        if (!model.columns || !Array.isArray(model.columns)) continue

        for (const col of model.columns) {
          const type = col.type.toLowerCase()
          const enumMatch = type.match(/^enum\((.*)\)$/)
          if (enumMatch && enumMatch[1]) {
            const values = enumMatch[1].split(',').map(v => v.trim().replace(/^'|'$/g, ""))
            
            const enumName = `${model.name.toUpperCase()}_${col.name.toUpperCase()}`
            lines.push(`export const ${enumName} = {`)
            for (const val of values) {
              const key = val.toUpperCase().replace(/[^A-Z0-9]/g, '_')
              lines.push(`  ${key}: '${val}',`)
            }
            lines.push(`} as const`)
            lines.push(``)
            const typeName = `${model.name}${col.name.charAt(0).toUpperCase() + col.name.slice(1)}`
            lines.push(`export type ${typeName} = (typeof ${enumName})[keyof typeof ${enumName}]`)
            lines.push(``)
          }
        }
      }
    }

    return lines
  }
}
