import { EndpointCallable } from './defineApi'

type HookMap = Record<string, (...args: any[]) => any>

/**
 * generateHooks — auto-generate TanStack hooks from a full defineApi result.
 *
 * Reads method from endpoint.$def.method — no heuristics, no string matching.
 *
 * Usage:
 *   const api = defineApi({ cart: { list: endpoint({...}), create: endpoint({...}) } })
 *   const hooks = generateHooks(api)
 *   const { useCartList, useCartCreate } = hooks
 */
export function generateHooks(
  api: Record<string, Record<string, EndpointCallable>>
): HookMap {
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
    for (const [action, endpoint] of Object.entries(actions)) {
      const method = endpoint.$def.method
      const hookName = toHookName(group, action)

      if (method === 'GET' || method === 'DELETE') {
        hooks[hookName] = (options?: any, queryOptions?: any) =>
          useQuery({
            queryKey: options ? [...endpoint.$key, options] : endpoint.$key,
            queryFn: () => endpoint(options),
            ...queryOptions,
          })
      } else {
        hooks[hookName] = (mutationOptions?: any) => {
          const qc = useQueryClient()
          return useMutation({
            ...mutationOptions,
            mutationFn: (options: any) => endpoint(options),
            onSuccess: (...args: any[]) => {
              qc.invalidateQueries({ queryKey: [group] })
              mutationOptions?.invalidate?.forEach((ep: EndpointCallable) => {
                qc.invalidateQueries({ queryKey: ep.$key })
              })
              mutationOptions?.onSuccess?.(...args)
            },
          })
        }
      }
    }
  }

  return hooks
}

function toHookName(group: string, action: string): string {
  const g = group.charAt(0).toUpperCase() + group.slice(1)
  const a = action.charAt(0).toUpperCase() + action.slice(1)
  return `use${g}${a}`
}
