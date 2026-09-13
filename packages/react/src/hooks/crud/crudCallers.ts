/**
 * crudCallers.ts
 *
 * Direct dispatch invocations for service endpoints (legacy functions or EndpointCallables).
 *
 * @module react/hooks/crud
 */

export const requireValidId = (id: unknown): number => {
  const parsed = Number(id)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ID: ${id}`)
  }
  return parsed
}

export const isEndpoint = (fn: unknown): boolean => typeof fn === 'function' && !!(fn as { $def?: unknown }).$def

export const callIndex = (svc: unknown): Promise<unknown> =>
  isEndpoint(svc)
    ? (svc as () => Promise<unknown>)()
    : (svc as () => Promise<unknown>)()

export const callShow = (svc: unknown, id: number): Promise<unknown> =>
  isEndpoint(svc)
    ? (svc as (opts: unknown) => Promise<unknown>)({ params: { id } })
    : (svc as (id: number) => Promise<unknown>)(id)

export const callCreate = (svc: unknown, data: unknown): Promise<unknown> =>
  isEndpoint(svc)
    ? (svc as (opts: unknown) => Promise<unknown>)({ body: data })
    : (svc as (data: unknown) => Promise<unknown>)(data)

export const callUpdate = (svc: unknown, id: number, data: unknown): Promise<unknown> =>
  isEndpoint(svc)
    ? (svc as (opts: unknown) => Promise<unknown>)({ params: { id }, body: data })
    : (svc as (id: number, data: unknown) => Promise<unknown>)(id, data)

export const callUpdateNoParam = (svc: unknown, data: unknown): Promise<unknown> =>
  isEndpoint(svc)
    ? (svc as (opts: unknown) => Promise<unknown>)({ body: data })
    : (svc as (data: unknown) => Promise<unknown>)(data)

export const callDelete = (svc: unknown, id: number): Promise<unknown> =>
  isEndpoint(svc)
    ? (svc as (opts: unknown) => Promise<unknown>)({ params: { id } })
    : (svc as (id: number) => Promise<unknown>)(id)

export const callDeleteNoParam = (svc: unknown): Promise<unknown> =>
  isEndpoint(svc)
    ? (svc as () => Promise<unknown>)()
    : (svc as () => Promise<unknown>)()
