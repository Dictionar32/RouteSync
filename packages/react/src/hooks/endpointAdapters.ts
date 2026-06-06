import { EndpointCallable } from '@routesync/sdk'

/**
 * Wrap a no-param GET EndpointCallable into `() => Promise<TResponse>`.
 *
 * Dipakai sebagai `service.index` di createCrudHooks — karena createCrudHooks
 * butuh plain async function, bukan EndpointCallable langsung.
 *
 * Usage:
 *   service: {
 *     index: toIndexFn(api.produk.list),
 *   }
 */
export function toIndexFn<TResponse>(
  endpoint: EndpointCallable<TResponse, unknown, unknown>
): () => Promise<TResponse> {
  return () => endpoint()
}

/**
 * Wrap a single-param GET EndpointCallable into `(id: number) => Promise<TResponse>`.
 *
 * Dipakai sebagai `service.show` di createCrudHooks.
 * `paramKey` adalah nama path param yang diexpect endpoint — default 'id'.
 *
 * Usage:
 *   service: {
 *     show: toShowFn(api.produk.get),
 *     // atau kalau param key beda:
 *     show: toShowFn(api.orders.get, 'orderId'),
 *   }
 */
export function toShowFn<TResponse>(
  endpoint: EndpointCallable<TResponse, Record<string, string | number>, unknown>,
  paramKey: string = 'id'
): (id: number) => Promise<TResponse> {
  return (id: number) => endpoint({ params: { [paramKey]: id } })
}