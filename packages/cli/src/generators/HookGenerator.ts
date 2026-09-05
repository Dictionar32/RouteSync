import {
  RouteManifest,
  matchCrudRole,
  ResourceGroupKind,
  FullCrudResourceGroupDescriptor,
  ReadOnlyCrudResourceGroupDescriptor,
  FlexibleCrudResourceGroupDescriptor,
  SingletonResourceGroupDescriptor,
  CustomResourceGroupDescriptor
} from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'
import { ClassifiedRoute, classifyDomainGraph, ClassifiedDomainGraph } from './route-classifier'

function lowerFullCrudCacheLines(
  group: FullCrudResourceGroupDescriptor<ClassifiedRoute>,
  addRouteInvalidations: (route: ClassifiedRoute, invs: string[]) => void
): string[] {
  const { groupName, listKeyFn, detailKeyFn } = group
  const cacheLines: string[] = [
    `      list: QueryKey.${groupName}.${listKeyFn},`,
    `      detail: QueryKey.${groupName}.${detailKeyFn},`
  ]

  const createInvs: string[] = [`          QueryKey.${groupName}.${listKeyFn},`]
  addRouteInvalidations(group.create, createInvs)
  cacheLines.push(`      create: {`)
  cacheLines.push(`        invalidate: [`)
  cacheLines.push(createInvs.join('\n'))
  cacheLines.push(`        ],`)
  cacheLines.push(`      },`)

  const updateInvs: string[] = [
    `          QueryKey.${groupName}.${listKeyFn},`,
    `          QueryKey.${groupName}.${detailKeyFn},`
  ]
  addRouteInvalidations(group.update, updateInvs)
  cacheLines.push(`      update: {`)
  cacheLines.push(`        invalidate: [`)
  cacheLines.push(updateInvs.join('\n'))
  cacheLines.push(`        ],`)
  cacheLines.push(`      },`)

  const deleteInvs: string[] = [`          QueryKey.${groupName}.${listKeyFn},`]
  addRouteInvalidations(group.delete, deleteInvs)
  cacheLines.push(`      remove: {`)
  cacheLines.push(`        invalidate: [`)
  cacheLines.push(deleteInvs.join('\n'))
  cacheLines.push(`        ],`)
  cacheLines.push(`      },`)

  return cacheLines
}

function lowerReadOnlyCrudCacheLines(
  group: ReadOnlyCrudResourceGroupDescriptor<ClassifiedRoute>
): string[] {
  const { groupName, listKeyFn, detailKeyFn } = group
  return [
    `      list: QueryKey.${groupName}.${listKeyFn},`,
    `      detail: QueryKey.${groupName}.${detailKeyFn},`
  ]
}

function lowerFlexibleCrudCacheLines(
  group: FlexibleCrudResourceGroupDescriptor<ClassifiedRoute>,
  addRouteInvalidations: (route: ClassifiedRoute, invs: string[]) => void
): string[] {
  const { groupName, listKeyFn, detailKeyFn } = group
  const cacheLines: string[] = [
    `      list: QueryKey.${groupName}.${listKeyFn},`,
    `      detail: QueryKey.${groupName}.${detailKeyFn},`
  ]

  if (group.create.available) {
    const invs: string[] = [`          QueryKey.${groupName}.${listKeyFn},`]
    addRouteInvalidations(group.create.route, invs)
    cacheLines.push(`      create: {`)
    cacheLines.push(`        invalidate: [`)
    cacheLines.push(invs.join('\n'))
    cacheLines.push(`        ],`)
    cacheLines.push(`      },`)
  }
  if (group.update.available) {
    const invs: string[] = [
      `          QueryKey.${groupName}.${listKeyFn},`,
      `          QueryKey.${groupName}.${detailKeyFn},`
    ]
    addRouteInvalidations(group.update.route, invs)
    cacheLines.push(`      update: {`)
    cacheLines.push(`        invalidate: [`)
    cacheLines.push(invs.join('\n'))
    cacheLines.push(`        ],`)
    cacheLines.push(`      },`)
  }
  if (group.delete.available) {
    const invs: string[] = [`          QueryKey.${groupName}.${listKeyFn},`]
    addRouteInvalidations(group.delete.route, invs)
    cacheLines.push(`      remove: {`)
    cacheLines.push(`        invalidate: [`)
    cacheLines.push(invs.join('\n'))
    cacheLines.push(`        ],`)
    cacheLines.push(`      },`)
  }

  return cacheLines
}

function lowerSingletonCacheLines(
  group: SingletonResourceGroupDescriptor<ClassifiedRoute>,
  addMutationRouteSlot: (actionKey: string, route: ClassifiedRoute, defaultInvs: string[]) => void
): void {
  const indexRoute = group.all.find(r => r.crudRole === 'index')
  const defaultInvs = indexRoute ? [`          QueryKey.${group.groupName}.${group.listKeyFn},`] : []
  const createRoute = group.all.find(r => r.crudRole === 'create')
  const updateRoute = group.all.find(r => r.crudRole === 'update')
  const deleteRoute = group.all.find(r => r.crudRole === 'delete')
  if (createRoute) addMutationRouteSlot('create', createRoute, defaultInvs)
  if (updateRoute) addMutationRouteSlot('update', updateRoute, defaultInvs)
  if (deleteRoute) addMutationRouteSlot('remove', deleteRoute, defaultInvs)
}

function lowerCustomCacheLines(
  group: CustomResourceGroupDescriptor<ClassifiedRoute>,
  addMutationRouteSlot: (actionKey: string, route: ClassifiedRoute, defaultInvs: string[]) => void
): void {
  const indexRoute = group.all.find(r => r.crudRole === 'index')
  const defaultInvs = indexRoute ? [`          QueryKey.${group.groupName}.${group.listKeyFn},`] : []
  const createRoute = group.all.find(r => r.crudRole === 'create')
  const updateRoute = group.all.find(r => r.crudRole === 'update')
  const deleteRoute = group.all.find(r => r.crudRole === 'delete')
  if (createRoute) addMutationRouteSlot('create', createRoute, defaultInvs)
  if (updateRoute) addMutationRouteSlot('update', updateRoute, defaultInvs)
  if (deleteRoute) addMutationRouteSlot('remove', deleteRoute, defaultInvs)
}

export class HookGenerator {
  static async generate(
    manifest: RouteManifest,
    outputDir?: string,
    domainGraph?: ClassifiedDomainGraph<ClassifiedRoute>
  ): Promise<string> {
    const graph = domainGraph ?? classifyDomainGraph(manifest)

    const importedTypes = new Set<string>()
    const contractImportedTypes = new Set<string>()
    const configBlocks: string[] = []

    const pushUnique = (items: string[], item: string): void => {
      if (!items.includes(item)) items.push(item)
    }

    const addRouteInvalidations = (route: ClassifiedRoute, invs: string[]): void => {
      for (const expr of route.contract.invalidation.queryKeyExpressions) {
        pushUnique(invs, `          ${expr},`)
      }
    }

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

    for (const group of graph.resourceGroupGraph.all) {
      const { groupName } = group
      for (const t of group.types.importedTypes) importedTypes.add(t)
      for (const t of group.types.contractImportedTypes) contractImportedTypes.add(t)

      const blockLines: string[] = []
      blockLines.push(`  ${groupName}: {`)
      blockLines.push(`    types: {`)
      blockLines.push(`      list: typeOf<${group.types.list}>(),`)
      blockLines.push(`      detail: typeOf<${group.types.detail}>(),`)
      blockLines.push(`      create: typeOf<${group.types.create}>(),`)
      blockLines.push(`      update: typeOf<${group.types.update}>(),`)
      if (group.types.hasCustomError) {
        blockLines.push(`      error: typeOf<${group.types.error}>(),`)
      }
      blockLines.push(`    },`)
      blockLines.push(``)
      blockLines.push(`    queryKey: QueryKey.${groupName},`)

      const actionKeyLines = group.all
        .map(route => `      ${toNormalizedActionKey(route)}: QueryKey.${groupName}.${route.actionName},`)
      if (actionKeyLines.length > 0) {
        blockLines.push(`    actionKeys: {`)
        blockLines.push(actionKeyLines.join('\n'))
        blockLines.push(`    },`)
      }
      blockLines.push(`    endpoint: api.${groupName},`)

      const cacheLines: string[] = []

      const addMutationRouteSlot = (actionKey: string, route: ClassifiedRoute, defaultInvalidations: string[]) => {
        const invs: string[] = [...defaultInvalidations]
        addRouteInvalidations(route, invs)
        if (invs.length > 0) {
          cacheLines.push(`      ${actionKey}: {`)
          cacheLines.push(`        invalidate: [`)
          cacheLines.push(invs.join('\n'))
          cacheLines.push(`        ],`)
          cacheLines.push(`      },`)
        }
      }

      // Pure typed dataflow lowering per domain variant (0 matchResourceGroup overhead)
      switch (group.kind) {
        case ResourceGroupKind.FullCrud:
          cacheLines.push(...lowerFullCrudCacheLines(group, addRouteInvalidations))
          break
        case ResourceGroupKind.ReadOnlyCrud:
          cacheLines.push(...lowerReadOnlyCrudCacheLines(group))
          break
        case ResourceGroupKind.FlexibleCrud:
          cacheLines.push(...lowerFlexibleCrudCacheLines(group, addRouteInvalidations))
          break
        case ResourceGroupKind.Singleton:
          lowerSingletonCacheLines(group, addMutationRouteSlot)
          break
        case ResourceGroupKind.Custom:
          lowerCustomCacheLines(group, addMutationRouteSlot)
          break
      }

      for (const route of group.all) {
        if (route.method === 'GET') continue
        if (['create', 'update', 'remove'].includes(route.actionName)) continue
        // updateSelf / deleteSelf sudah di-handle oleh defineHooks via put/patch/delete no-param
        if (['put', 'patch'].includes(route.actionName) && route.crudRole === 'update') continue
        if (route.actionName === 'delete' && route.crudRole === 'delete' && !route.hasTrailingParam) continue
        if (cacheLines.some(line => line.trim() === `${route.actionName}: {`)) continue

        const invs: string[] = []
        if (group.isCrud) {
          pushUnique(invs, `          QueryKey.${groupName}.${group.listKeyFn},`)
        }
        const customGets = group.all.filter(r => r.method === 'GET')
        for (const getRoute of customGets) {
          const hasKey = !group.isCrud || getRoute.crudRole === 'custom'
          if (hasKey) {
            pushUnique(invs, `          QueryKey.${groupName}.${getRoute.actionName},`)
          }
        }
        addRouteInvalidations(route, invs)

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

    for (const group of graph.resourceGroups) {
      const { groupName, titleName } = group
      const primaryRoute = group.all.find(r => r.crudRole === 'show') ?? group.all.find(r => r.crudRole === 'index') ?? group.all[0]
      if (primaryRoute) {
        lines.push(`/**`)
        lines.push(` * @provenance ${primaryRoute.contract.provenance.summary}`)
        if (primaryRoute.contract.provenance.route?.file) {
          lines.push(` * @see ${primaryRoute.contract.provenance.route.file}#L${primaryRoute.contract.provenance.route.line}`)
        }
        lines.push(` */`)
      }
      lines.push(`export const use${titleName} = hooks.${groupName}`)
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
