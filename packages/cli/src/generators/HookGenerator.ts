import { RouteManifest, matchCrudRole, matchResourceGroup } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'
import { toTypeName } from './names'
import { classifyRoutes, buildResourceMap, ClassifiedRoute, classifyDomainGraph, ClassifiedDomainGraph } from './route-classifier'

export class HookGenerator {
  static async generate(
    manifest: RouteManifest,
    outputDir?: string,
    domainGraph?: ClassifiedDomainGraph<ClassifiedRoute>
  ): Promise<string> {
    const graph = domainGraph ?? classifyDomainGraph(manifest)
    const classified = classifyRoutes(manifest.routes, manifest.frontend?.groupAliases)
    const resources = buildResourceMap(classified)

    const importedTypes = new Set<string>()
    const contractImportedTypes = new Set<string>()
    const configBlocks: string[] = []

    for (const [groupName, resource] of resources) {
      const groupDesc = graph.resourceGroupMap.get(groupName) ?? graph.resourceGroups.find(g => g.groupName === groupName)!
      for (const t of groupDesc.types.importedTypes) importedTypes.add(t)
      for (const t of groupDesc.types.contractImportedTypes) contractImportedTypes.add(t)

      const pushUnique = (items: string[], item: string): void => {
        if (!items.includes(item)) items.push(item)
      }

      const addCrossResourceInvalidations = (actionRouteOrName: any, invs: string[]): void => {
        let route = actionRouteOrName
        if (typeof actionRouteOrName === 'string') {
          route = (resource as any)[actionRouteOrName] ?? resource.all?.find((r: any) => r.actionName === actionRouteOrName)
        }
        const expressions = route?.contract?.invalidation?.queryKeyExpressions ?? route?.raw?.invalidation?.queryKeyExpressions ?? route?.invalidation?.queryKeyExpressions
        if (expressions) {
          for (const expr of expressions) {
            pushUnique(invs, `          ${expr},`)
          }
        }
      }

      const blockLines: string[] = []
      blockLines.push(`  ${groupName}: {`)
      blockLines.push(`    types: {`)
      blockLines.push(`      list: typeOf<${groupDesc.types.list}>(),`)
      blockLines.push(`      detail: typeOf<${groupDesc.types.detail}>(),`)
      blockLines.push(`      create: typeOf<${groupDesc.types.create}>(),`)
      blockLines.push(`      update: typeOf<${groupDesc.types.update}>(),`)
      if (groupDesc.types.hasCustomError) {
        blockLines.push(`      error: typeOf<${groupDesc.types.error}>(),`)
      }
      blockLines.push(`    },`)
      blockLines.push(``)
      blockLines.push(`    queryKey: QueryKey.${groupName},`)
      const toNormalizedActionKey = (route: ClassifiedRoute): string => {
        return matchCrudRole(route.crudRole, {
          update: () => 'update',
          delete: () => 'remove',
          index: () => route.actionName,
          show: () => route.actionName,
          create: () => route.actionName,
          custom: () => route.actionName
        })
      }
      const actionKeyLines = resource.all
        .map(route => `      ${toNormalizedActionKey(route)}: QueryKey.${groupName}.${route.actionName},`)
      if (actionKeyLines.length > 0) {
        blockLines.push(`    actionKeys: {`)
        blockLines.push(actionKeyLines.join('\n'))
        blockLines.push(`    },`)
      }
      blockLines.push(`    endpoint: api.${groupName},`)

      const listKeyFn = groupDesc?.listKeyFn ?? 'list'
      const detailKeyFn = groupDesc?.detailKeyFn ?? (resource.show?.actionName ?? 'detail')

      const cacheLines: string[] = []

      if (groupDesc) {
        matchResourceGroup(groupDesc, {
          full_crud: (fg) => {
            cacheLines.push(`      list: QueryKey.${groupName}.${fg.listKeyFn},`)
            cacheLines.push(`      detail: QueryKey.${groupName}.${fg.detailKeyFn},`)

            const createInvs: string[] = [`          QueryKey.${groupName}.${fg.listKeyFn},`]
            addCrossResourceInvalidations('create', createInvs)
            cacheLines.push(`      create: {`)
            cacheLines.push(`        invalidate: [`)
            cacheLines.push(createInvs.join('\n'))
            cacheLines.push(`        ],`)
            cacheLines.push(`      },`)

            const updateInvs: string[] = [
              `          QueryKey.${groupName}.${fg.listKeyFn},`,
              `          QueryKey.${groupName}.${fg.detailKeyFn},`
            ]
            addCrossResourceInvalidations('update', updateInvs)
            cacheLines.push(`      update: {`)
            cacheLines.push(`        invalidate: [`)
            cacheLines.push(updateInvs.join('\n'))
            cacheLines.push(`        ],`)
            cacheLines.push(`      },`)

            const deleteInvs: string[] = [`          QueryKey.${groupName}.${fg.listKeyFn},`]
            addCrossResourceInvalidations('delete', deleteInvs)
            cacheLines.push(`      remove: {`)
            cacheLines.push(`        invalidate: [`)
            cacheLines.push(deleteInvs.join('\n'))
            cacheLines.push(`        ],`)
            cacheLines.push(`      },`)
          },
          read_only_crud: (rg) => {
            cacheLines.push(`      list: QueryKey.${groupName}.${rg.listKeyFn},`)
            cacheLines.push(`      detail: QueryKey.${groupName}.${rg.detailKeyFn},`)
          },
          flexible_crud: (flg) => {
            cacheLines.push(`      list: QueryKey.${groupName}.${flg.listKeyFn},`)
            cacheLines.push(`      detail: QueryKey.${groupName}.${flg.detailKeyFn},`)
            if (flg.create.available) {
              const invs: string[] = [`          QueryKey.${groupName}.${flg.listKeyFn},`]
              addCrossResourceInvalidations('create', invs)
              cacheLines.push(`      create: {`)
              cacheLines.push(`        invalidate: [`)
              cacheLines.push(invs.join('\n'))
              cacheLines.push(`        ],`)
              cacheLines.push(`      },`)
            }
            if (flg.update.available) {
              const invs: string[] = [
                `          QueryKey.${groupName}.${flg.listKeyFn},`,
                `          QueryKey.${groupName}.${flg.detailKeyFn},`
              ]
              addCrossResourceInvalidations('update', invs)
              cacheLines.push(`      update: {`)
              cacheLines.push(`        invalidate: [`)
              cacheLines.push(invs.join('\n'))
              cacheLines.push(`        ],`)
              cacheLines.push(`      },`)
            }
            if (flg.delete.available) {
              const invs: string[] = [`          QueryKey.${groupName}.${flg.listKeyFn},`]
              addCrossResourceInvalidations('delete', invs)
              cacheLines.push(`      remove: {`)
              cacheLines.push(`        invalidate: [`)
              cacheLines.push(invs.join('\n'))
              cacheLines.push(`        ],`)
              cacheLines.push(`      },`)
            }
          },
          crud: (cg) => {
            if (cg.index) cacheLines.push(`      list: QueryKey.${groupName}.${cg.listKeyFn},`)
            if (cg.show) cacheLines.push(`      detail: QueryKey.${groupName}.${cg.detailKeyFn},`)
            const addMutationSlot = (actionKey: string, route?: ClassifiedRoute) => {
              if (!route) return
              const invs: string[] = []
              if (resource.index) {
                pushUnique(invs, `          QueryKey.${groupName}.${listKeyFn},`)
              }
              addCrossResourceInvalidations(actionKey, invs)
              if (invs.length > 0) {
                cacheLines.push(`      ${actionKey}: {`)
                cacheLines.push(`        invalidate: [`)
                cacheLines.push(invs.join('\n'))
                cacheLines.push(`        ],`)
                cacheLines.push(`      },`)
              }
            }
            if (resource.create) addMutationSlot('create', resource.create)
            if (resource.update) addMutationSlot('update', resource.update)
            if (resource.delete) addMutationSlot('remove', resource.delete)
          },
          singleton: () => {
            const addMutationSlot = (actionKey: string, route?: ClassifiedRoute) => {
              if (!route) return
              const invs: string[] = []
              if (resource.index) {
                pushUnique(invs, `          QueryKey.${groupName}.${listKeyFn},`)
              }
              addCrossResourceInvalidations(actionKey, invs)
              if (invs.length > 0) {
                cacheLines.push(`      ${actionKey}: {`)
                cacheLines.push(`        invalidate: [`)
                cacheLines.push(invs.join('\n'))
                cacheLines.push(`        ],`)
                cacheLines.push(`      },`)
              }
            }
            if (resource.create) addMutationSlot('create', resource.create)
            if (resource.update) addMutationSlot('update', resource.update)
            if (resource.delete) addMutationSlot('remove', resource.delete)
          },
          custom: () => {
            const addMutationSlot = (actionKey: string, route?: ClassifiedRoute) => {
              if (!route) return
              const invs: string[] = []
              if (resource.index) {
                pushUnique(invs, `          QueryKey.${groupName}.${listKeyFn},`)
              }
              addCrossResourceInvalidations(actionKey, invs)
              if (invs.length > 0) {
                cacheLines.push(`      ${actionKey}: {`)
                cacheLines.push(`        invalidate: [`)
                cacheLines.push(invs.join('\n'))
                cacheLines.push(`        ],`)
                cacheLines.push(`      },`)
              }
            }
            if (resource.create) addMutationSlot('create', resource.create)
            if (resource.update) addMutationSlot('update', resource.update)
            if (resource.delete) addMutationSlot('remove', resource.delete)
          }
        })
      } else {
        if (resource.index) {
          cacheLines.push(`      list: QueryKey.${groupName}.${listKeyFn},`)
        }
        if (resource.show) {
          cacheLines.push(`      detail: QueryKey.${groupName}.${detailKeyFn},`)
        }
      }

      for (const route of resource.all) {
        if (route.method === 'GET') continue
        if (['create', 'update', 'remove'].includes(route.actionName)) continue
        // updateSelf / deleteSelf sudah di-handle oleh defineHooks via put/patch/delete no-param
        if (['put', 'patch'].includes(route.actionName) && route.crudRole === 'update') continue
        if (route.actionName === 'delete' && route.crudRole === 'delete' && !route.hasTrailingParam) continue
        if (cacheLines.some(line => line.trim() === `${route.actionName}: {`)) continue

        const invs: string[] = []
        if (resource.index) {
          pushUnique(invs, `          QueryKey.${groupName}.${listKeyFn},`)
        }
        const customGets = resource.all.filter(r => r.method === 'GET')
        for (const getRoute of customGets) {
          const hasKey = !(groupDesc?.isCrud ?? false) || getRoute.crudRole === 'custom'
          if (hasKey) {
            pushUnique(invs, `          QueryKey.${groupName}.${getRoute.actionName},`)
          }
        }
        addCrossResourceInvalidations(route.actionName, invs)

        cacheLines.push(`      ${route.actionName}: {`)
        cacheLines.push(`        invalidate: [`)
        if (invs.length > 0) {
          cacheLines.push(invs.join('\n'))
        }
        cacheLines.push(`        ],`)
        cacheLines.push(`      },`)
      }

      if (cacheLines.length > 0) {
        blockLines.push(``)
        blockLines.push(`    cache: {`)
        blockLines.push(cacheLines.join('\n'))
        blockLines.push(`    },`)
      }

      blockLines.push(`  },`)

      configBlocks.push(blockLines.join('\n'))
    }

    // Generate routesync.runtime.ts
    const runtimeConfigLines: string[] = []
    runtimeConfigLines.push(`// Auto-generated by routesync. Do not edit manually.`)
    runtimeConfigLines.push(``)
    runtimeConfigLines.push(`export const runtimeManifest = {`)
    runtimeConfigLines.push(`  resources: {},`)
    runtimeConfigLines.push(`  domains: ${JSON.stringify(manifest.frontend?.domains || {}, null, 2)},`)
    runtimeConfigLines.push(`  intents: {}`)
    runtimeConfigLines.push(`} as const`)
    runtimeConfigLines.push(``)
    if (outputDir) {
      await fs.writeFile(path.join(outputDir, 'routesync.runtime.ts'), runtimeConfigLines.join('\n'))
    }

    const lines: string[] = []
    lines.push(`// Auto-generated by routesync. Do not edit manually.`)
    lines.push(``)
    lines.push(`import { defineHooks, useAggregateCollectionIntent } from 'routesync/react'`)
    lines.push(`import { api } from './api'`)
    lines.push(`import { QueryKey } from './query-key'`)
    lines.push(`import { runtimeManifest } from './routesync.runtime'`)

    if (importedTypes.size > 0) {
      lines.push(`import type {`)
      for (const t of Array.from(importedTypes).sort()) {
        lines.push(`  ${t},`)
      }
      lines.push(`} from './types/index'`)
    }

    if (contractImportedTypes.size > 0) {
      lines.push(`import type {`)
      for (const t of Array.from(contractImportedTypes).sort()) {
        lines.push(`  ${t},`)
      }
      lines.push(`} from './contract/api-schema'`)
    }

    lines.push(``)
    lines.push(`export const typeOf = <T>() => ({} as T)`)
    lines.push(``)
    lines.push(`const baseHooks = defineHooks({`)
    lines.push(configBlocks.join('\n'))
    lines.push(`}, runtimeManifest)`)
    lines.push(``)

    lines.push(`export const hooks = baseHooks`)
    lines.push(``)

    for (const [, resource] of resources) {
      const { groupName } = resource
      const TitleGroup = toTypeName(groupName)
      const primaryRoute = resource.show ?? resource.index ?? resource.all[0]
      if (primaryRoute?.contract?.provenance) {
        lines.push(`/**`)
        lines.push(` * @provenance ${primaryRoute.contract.provenance.summary}`)
        if (primaryRoute.contract.provenance.route?.file) {
          lines.push(` * @see ${primaryRoute.contract.provenance.route.file}#L${primaryRoute.contract.provenance.route.line}`)
        }
        lines.push(` */`)
      }
      lines.push(`export const use${TitleGroup} = hooks.${groupName}`)
    }

    lines.push(``)
    lines.push(`export * from './query-key'`)
    lines.push(``)

    const result = lines.join('\n')
    if (outputDir) {
      await fs.writeFile(path.join(outputDir, 'hooks.ts'), result)
    }
    return result
  }
}
