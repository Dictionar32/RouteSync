import { RouteManifest } from '@routesync/core'
import { classifyRoutes, buildResourceMap } from '../generators/route-classifier'

export class IntentResolver {
  static resolve(manifest: RouteManifest): RouteManifest {
    if (!manifest.frontend) {
      manifest.frontend = {}
    }
    if (!manifest.frontend.domains) {
      manifest.frontend.domains = {}
    }

    const classified = classifyRoutes(manifest.routes, manifest.frontend.groupAliases)
    const resources = buildResourceMap(classified)

    for (const [groupName] of resources) {
      const domainVal = manifest.frontend.domains[groupName]
      if (domainVal === 'cart' || (domainVal && typeof domainVal === 'object' && domainVal.type === 'cart')) {
        const cartGroupName = groupName
        
        let itemKey = 'id'
        let qtyField = 'qty'
        let itemsField = 'items'
        let itemsGroupName = ''
        let promoGroupName = ''

        let cartModelName = ''
        for (const route of classified) {
          if (route.groupName === cartGroupName && route.method === 'GET') {
            const resolvedName = route.raw.response?.model || route.raw.response?.resolved?.model
            if (resolvedName) {
              cartModelName = resolvedName
              break
            }
          }
        }

        const cartModel = manifest.models?.find(m => m.name === cartModelName)
        let itemsModelName = ''
        if (cartModel && cartModel.relations) {
          for (const [relName, rel] of Object.entries(cartModel.relations)) {
            if (rel.type === 'hasMany') {
              itemsField = relName
              itemsModelName = rel.model
              break
            }
          }
        }

        const itemsModel = manifest.models?.find(m => m.name === itemsModelName)
        if (itemsModel) {
          if (itemsModel.columns) {
            const foundQty = itemsModel.columns.find(c => {
              const nameLower = c.name.toLowerCase()
              return nameLower === 'qty' || nameLower === 'quantity' || nameLower === 'jumlah' || nameLower === 'count'
            })
            if (foundQty) {
              qtyField = foundQty.name.replace(/[_-]([a-z])/g, (_, letter) => letter.toUpperCase())
            }
          }

          if (itemsModel.relations) {
            for (const [relName, rel] of Object.entries(itemsModel.relations)) {
              if (rel.type === 'belongsTo' && rel.model !== cartModelName) {
                const possibleKeys = [
                  `${relName}_id`,
                  `${relName}Id`,
                  `${rel.model.toLowerCase()}_id`,
                  `${rel.model.toLowerCase()}Id`,
                ]
                if (itemsModel.columns) {
                  const foundCol = itemsModel.columns.find(c => {
                    const colCamel = c.name.replace(/[_-]([a-z])/g, (_, letter) => letter.toUpperCase())
                    return possibleKeys.includes(c.name) || possibleKeys.includes(colCamel) || c.name.includes('item_id') || c.name.includes('product_id')
                  })
                  if (foundCol) {
                    itemKey = foundCol.name.replace(/[_-]([a-z])/g, (_, letter) => letter.toUpperCase())
                    break
                  }
                }
              }
            }
          }
        }

        const cartPath = classified.find(r => r.groupName === cartGroupName)?.raw.path || ''
        if (cartPath) {
          for (const [, res] of resources) {
            const resGroupName = res.groupName
            if (resGroupName === cartGroupName) continue

            let resPath = ''
            let hasPathParams = false
            for (const route of manifest.routes) {
              if (route.group === resGroupName) {
                resPath = route.path
                if (route.path.includes('{') || route.path.includes(':')) {
                  hasPathParams = true
                }
              }
            }

            if (resPath && resPath.startsWith(cartPath + '/')) {
              if (hasPathParams) {
                itemsGroupName = resGroupName
              } else {
                promoGroupName = resGroupName
              }
            }
          }
        }

        if (!itemsGroupName) itemsGroupName = `${cartGroupName}Items`
        if (!promoGroupName) promoGroupName = `${cartGroupName}Promo`

        let promoKey = 'code'
        if (promoGroupName) {
          const promoRoute = manifest.routes.find(r => r.group === promoGroupName && (r.method === 'POST' || r.method === 'PUT' || r.method === 'PATCH'))
          if (promoRoute && 'body' in promoRoute && promoRoute.body && typeof promoRoute.body === 'object') {
            const bodyObj = promoRoute.body
            const schema = 'schema' in bodyObj ? bodyObj.schema : bodyObj
            if (schema && typeof schema === 'object') {
              let props: unknown = null
              if ('properties' in schema) {
                props = schema.properties
              } else if ('resolved' in schema && schema.resolved && typeof schema.resolved === 'object' && 'properties' in schema.resolved) {
                props = schema.resolved.properties
              }
              if (props && typeof props === 'object') {
                const keys = Object.keys(props)
                const foundKey = keys.find(k => {
                  const kLower = k.toLowerCase()
                  return kLower === 'code' || kLower === 'coupon' || kLower === 'promo' || kLower === 'voucher'
                })
                if (foundKey) {
                  promoKey = foundKey
                } else if (keys.length > 0) {
                  promoKey = keys[0]
                }
              }
            }
          }
        }

        const explicitConfig = typeof domainVal === 'object' ? domainVal : {}

        manifest.frontend.domains[groupName] = {
          type: 'AggregateCollection',
          operations: {
            createItem: `${explicitConfig.items || itemsGroupName}.useCreate`,
            updateItem: `${explicitConfig.items || itemsGroupName}.useUpdate`,
            removeItem: `${explicitConfig.items || itemsGroupName}.useRemove`,
            applyPromo: explicitConfig.promo || promoGroupName ? `${explicitConfig.promo || promoGroupName}.useCreate` : '',
            removePromo: explicitConfig.promo || promoGroupName ? `${explicitConfig.promo || promoGroupName}.useDelete` : ''
          },
          config: {
            itemsField: explicitConfig.itemsField || itemsField,
            itemKey: explicitConfig.itemKey || itemKey,
            qtyField: explicitConfig.qtyField || qtyField,
            promoKey: explicitConfig.promoKey || promoKey
          }
        }
      }
    }

    return manifest
  }
}
