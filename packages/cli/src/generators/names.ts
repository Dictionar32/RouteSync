import { type RouteSemanticFlow } from '@routesync/core'
import { projectRoutes } from './route-capability-projection'

export type GeneratedRoute = RouteSemanticFlow & {
  groupName: string
  actionName: string
  runtimePath: string
}

export function buildGeneratedRoutes(
  routes: RouteSemanticFlow[],
  groupAliases?: Record<string, string>
): Record<string, GeneratedRoute[]> {
  const classified = projectRoutes(routes, groupAliases)
  const grouped: Record<string, GeneratedRoute[]> = {}

  for (const route of classified) {
    grouped[route.groupName] ??= []
    grouped[route.groupName].push({
      ...route.raw,
      groupName: route.groupName,
      actionName: route.actionName,
      runtimePath: route.runtimePath
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

export function toMethodName(route: RouteSemanticFlow): string {
  const routeName = route.identity.coordinates.name.value.value
  if (routeName.length > 0) {
    const parts = routeName.split('.')
    return toIdentifier(parts.join(' '))
  }
  return toIdentifier(route.identity.coordinates.method + ' ' + route.identity.coordinates.path.value.value)
}
