import { ParsedRoute } from '@routesync/core'

export type GeneratedRoute = ParsedRoute & {
  groupName: string
  actionName: string
  runtimePath: string
}

export function buildGeneratedRoutes(routes: ParsedRoute[]): Record<string, GeneratedRoute[]> {
  const grouped: Record<string, GeneratedRoute[]> = {}
  const usedActions: Record<string, Set<string>> = {}

  for (const route of routes) {
    const segments = getPathSegments(route.path)
    const groupName = toIdentifier(segments[0] ?? 'root')
    const baseActionName = toActionName(route, segments.slice(1))

    usedActions[groupName] ??= new Set()
    const actionName = uniquify(baseActionName, usedActions[groupName])

    grouped[groupName] ??= []
    grouped[groupName].push({
      ...route,
      groupName,
      actionName,
      runtimePath: toRuntimePath(route.path)
    })
  }

  return grouped
}

export function toTypeName(value: string): string {
  return splitWords(value)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') || 'Root'
}

export function toIdentifier(value: string): string {
  const [first = 'root', ...rest] = splitWords(value)
  const identifier = [
    first.toLowerCase(),
    ...rest.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  ].join('')

  return /^[A-Za-z_$]/.test(identifier) ? identifier : `route${toTypeName(identifier)}`
}

export function toRuntimePath(path: string): string {
  return path.replace(/{([^}/]+)}/g, ':$1')
}

function toActionName(route: ParsedRoute, restSegments: string[]): string {
  const method = route.method.toLowerCase()
  const suffix = restSegments.map(normalizeSegment).filter(Boolean).map(toTypeName).join('')
  return toIdentifier(suffix ? `${method}-${suffix}` : method)
}

function normalizeSegment(segment: string): string {
  return segment.replace(/^{([^}/]+)}$/, '$1')
}

function getPathSegments(path: string): string[] {
  return path.replace(/^\//, '').split('/').filter(Boolean)
}

function splitWords(value: string): string[] {
  return value
    .replace(/^{([^}/]+)}$/, '$1')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase())
}

function uniquify(baseName: string, used: Set<string>): string {
  if (!used.has(baseName)) {
    used.add(baseName)
    return baseName
  }

  let index = 2
  let name = `${baseName}${index}`

  while (used.has(name)) {
    index += 1
    name = `${baseName}${index}`
  }

  used.add(name)
  return name
}
