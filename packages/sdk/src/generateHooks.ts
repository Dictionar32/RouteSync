import { ApiDefinition } from '@routesync/core'

type HookMap = Record<string, Record<string, (...args: any[]) => any>>

/**
 * generateHooks
 *
 * Wraps a defineApi result and generates React Query-compatible
 * hook functions dynamically at runtime.
 *
 * Usage:
 *   const hooks = generateHooks(api)
 *   const { useProdukList, useProdukDetail } = hooks
 */
export function generateHooks(
  api: Record<string, Record<string, (options?: any) => Promise<any>>>
): HookMap {
  // Dynamic import to keep @routesync/react as optional peer dependency
  let useQuery: any
  let useMutation: any
  let useQueryClient: any

  try {
    const rq = require('@tanstack/react-query')
    useQuery = rq.useQuery
    useMutation = rq.useMutation
    useQueryClient = rq.useQueryClient
  } catch {
    throw new Error(
      '@tanstack/react-query is required to use generateHooks. ' +
      'Install it with: npm install @tanstack/react-query'
    )
  }

  const hooks: HookMap = {}

  for (const [group, actions] of Object.entries(api)) {
    for (const [action, fn] of Object.entries(actions)) {
      const hookName = toHookName(group, action)

      // GET → useQuery
      if (isQueryAction(action)) {
        hooks[hookName] = (options?: any) =>
          useQuery({
            queryKey: [group, action, options],
            queryFn: () => fn(options)
          })
      } else {
        // POST/PUT/PATCH/DELETE → useMutation
        hooks[hookName] = () => {
          const qc = useQueryClient()
          return useMutation({
            mutationFn: (options: any) => fn(options),
            onSuccess: () => {
              qc.invalidateQueries({ queryKey: [group] })
            }
          })
        }
      }
    }
  }

  return hooks
}

function isQueryAction(action: string): boolean {
  return ['index', 'list', 'show', 'detail', 'get', 'find'].some((k) =>
    action.toLowerCase().includes(k)
  )
}

function toHookName(group: string, action: string): string {
  const g = group.charAt(0).toUpperCase() + group.slice(1)
  const a = action.charAt(0).toUpperCase() + action.slice(1)

  if (isQueryAction(action)) return `use${g}${a}`
  return `use${g}${a}`
}
