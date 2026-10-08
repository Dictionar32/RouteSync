import type { EndpointCallable } from './defineApi'

type HookMap = Record<string, (...args: never[]) => unknown>

/**
 * generateHooks is a pure consumer of closed upstream route execution
 * capability. It never classifies an endpoint from HTTP method/action names.
 */
export function generateHooks(
  api: Record<string, Record<string, EndpointCallable>>
): HookMap {
  let useQuery: typeof import('@tanstack/react-query').useQuery
  let useInfiniteQuery: typeof import('@tanstack/react-query').useInfiniteQuery
  let useMutation: typeof import('@tanstack/react-query').useMutation
  let useQueryClient: typeof import('@tanstack/react-query').useQueryClient

  try {
    const rq = require('@tanstack/react-query') as typeof import('@tanstack/react-query')
    useQuery = rq.useQuery
    useInfiniteQuery = rq.useInfiniteQuery
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
      const hookKind = endpoint.$def.hookKind
      if (!hookKind) {
        throw new Error(`RouteSync endpoint ${group}.${action} is missing the upstream hook-kind capability`)
      }
      const hookName = toHookName(group, action)

      if (hookKind === 'query') {
        hooks[hookName] = ((options?: never, queryOptions?: never) =>
          useQuery({
            queryKey: endpoint.$queryKey(options),
            queryFn: () => endpoint(options),
            ...(queryOptions as object | undefined),
          })) as (...args: never[]) => unknown
      } else if (hookKind === 'infinite_query') {
        hooks[hookName] = ((options?: never, queryOptions?: never) =>
          useInfiniteQuery({
            queryKey: endpoint.$queryKey(options),
            initialPageParam: undefined,
            queryFn: ({ pageParam }) => endpoint({ ...(options as object | undefined), pageParam } as never),
            ...(queryOptions as object | undefined),
          })) as (...args: never[]) => unknown
      } else if (hookKind === 'mutation') {
        hooks[hookName] = ((mutationOptions?: never) => {
          const qc = useQueryClient()
          const options = mutationOptions as object & {
            onSuccess?: (...args: never[]) => void
            invalidate?: EndpointCallable[]
          } | undefined
          return useMutation({
            ...options,
            mutationFn: (options: never) => endpoint(options),
            onSuccess: (...args: never[]) => {
              options?.invalidate?.forEach((ep) => {
                qc.invalidateQueries({ queryKey: ep.$queryKey() })
              })
              options?.onSuccess?.(...args)
            },
          })
        }) as (...args: never[]) => unknown
      } else {
        throw new Error(`RouteSync endpoint ${group}.${action} has an unsupported upstream hook-kind capability`)
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
