import { RouteDefinition } from '@routesync/core'

export type EndpointDefinition = RouteDefinition

/**
 * endpoint() — declare a typed endpoint definition.
 *
 * Each endpoint fully owns its path. Use inside defineApi() or resource().
 *
 * Usage:
 *   const api = defineApi({
 *     cart: {
 *       list: endpoint({ method: 'GET',  path: '/cart/items' }),
 *       create: endpoint({ method: 'POST', path: '/cart/items' }),
 *     }
 *   })
 *
 *   // TanStack-friendly:
 *   const { data } = useApiQuery(api.cart.list)
 *   const mutation = useApiMutation(api.cart.create)
 */
export function endpoint(def: RouteDefinition): RouteDefinition {
  return def
}