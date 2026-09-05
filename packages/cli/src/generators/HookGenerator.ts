import {
  RouteManifest,
  matchCrudRole,
  ResourceGroupKind,
  FullCrudResourceGroupDescriptor,
  ReadOnlyCrudResourceGroupDescriptor,
  FlexibleCrudResourceGroupDescriptor,
  SingletonResourceGroupDescriptor,
  CustomResourceGroupDescriptor,
  ResourceGroupDescriptor
} from '@routesync/core'
import path from 'path'
import { ClassifiedRoute, classifyDomainGraph, ClassifiedDomainGraph } from './route-classifier'
import { CodeWriter } from './code-writer'

function pushUnique(items: string[], item: string): void {
  if (!items.includes(item)) items.push(item)
}

function addRouteInvalidations(route: ClassifiedRoute, invs: string[]): void {
  for (const expr of route.contract.invalidation.queryKeyExpressions) {
    pushUnique(invs, `          ${expr},`)
  }
}

function toNormalizedActionKey(route: ClassifiedRoute): string {
  return matchCrudRole(route.crudRole, {
    update: () => 'update',
    delete: () => 'remove',
    index: () => route.actionName,
    show: () => route.actionName,
    create: () => route.actionName,
    custom: () => route.actionName
  })
}

function* lowerMutationSlot(
  actionKey: string,
  route: ClassifiedRoute,
  defaultInvs: readonly string[],
  addInvs: (route: ClassifiedRoute, invs: string[]) => void
): Iterable<string> {
  const invs: string[] = [...defaultInvs]
  addInvs(route, invs)
  if (invs.length > 0) {
    yield `      ${actionKey}: {`
    yield `        invalidate: [`
    for (const inv of invs) {
      yield inv
    }
    yield `        ],`
    yield `      },`
  }
}

function* lowerFullCrudCache(
  group: FullCrudResourceGroupDescriptor<ClassifiedRoute>,
  addInvs: (route: ClassifiedRoute, invs: string[]) => void
): Iterable<string> {
  const { groupName, listKeyFn, detailKeyFn } = group
  yield `      list: QueryKey.${groupName}.${listKeyFn},`
  yield `      detail: QueryKey.${groupName}.${detailKeyFn},`

  yield* lowerMutationSlot('create', group.create, [`          QueryKey.${groupName}.${listKeyFn},`], addInvs)
  yield* lowerMutationSlot('update', group.update, [
    `          QueryKey.${groupName}.${listKeyFn},`,
    `          QueryKey.${groupName}.${detailKeyFn},`
  ], addInvs)
  yield* lowerMutationSlot('remove', group.delete, [`          QueryKey.${groupName}.${listKeyFn},`], addInvs)
}

function* lowerReadOnlyCrudCache(
  group: ReadOnlyCrudResourceGroupDescriptor<ClassifiedRoute>
): Iterable<string> {
  const { groupName, listKeyFn, detailKeyFn } = group
  yield `      list: QueryKey.${groupName}.${listKeyFn},`
  yield `      detail: QueryKey.${groupName}.${detailKeyFn},`
}

function* lowerFlexibleCrudCache(
  group: FlexibleCrudResourceGroupDescriptor<ClassifiedRoute>,
  addInvs: (route: ClassifiedRoute, invs: string[]) => void
): Iterable<string> {
  const { groupName, listKeyFn, detailKeyFn } = group
  yield `      list: QueryKey.${groupName}.${listKeyFn},`
  yield `      detail: QueryKey.${groupName}.${detailKeyFn},`

  if (group.create.available) {
    yield* lowerMutationSlot('create', group.create.route, [`          QueryKey.${groupName}.${listKeyFn},`], addInvs)
  }
  if (group.update.available) {
    yield* lowerMutationSlot('update', group.update.route, [
      `          QueryKey.${groupName}.${listKeyFn},`,
      `          QueryKey.${groupName}.${detailKeyFn},`
    ], addInvs)
  }
  if (group.delete.available) {
    yield* lowerMutationSlot('remove', group.delete.route, [`          QueryKey.${groupName}.${listKeyFn},`], addInvs)
  }
}

function* lowerSingletonCache(
  group: SingletonResourceGroupDescriptor<ClassifiedRoute>,
  addInvs: (route: ClassifiedRoute, invs: string[]) => void,
  handledActionKeys: Set<string>
): Iterable<string> {
  const indexRoute = group.all.find(r => r.crudRole === 'index')
  const defaultInvs = indexRoute ? [`          QueryKey.${group.groupName}.${group.listKeyFn},`] : []
  const createRoute = group.all.find(r => r.crudRole === 'create')
  const updateRoute = group.all.find(r => r.crudRole === 'update')
  const deleteRoute = group.all.find(r => r.crudRole === 'delete')
  if (createRoute) {
    yield* lowerMutationSlot('create', createRoute, defaultInvs, addInvs)
    handledActionKeys.add('create')
  }
  if (updateRoute) {
    yield* lowerMutationSlot('update', updateRoute, defaultInvs, addInvs)
    handledActionKeys.add('update')
  }
  if (deleteRoute) {
    yield* lowerMutationSlot('remove', deleteRoute, defaultInvs, addInvs)
    handledActionKeys.add('remove')
  }
}

function* lowerCustomCache(
  group: CustomResourceGroupDescriptor<ClassifiedRoute>,
  addInvs: (route: ClassifiedRoute, invs: string[]) => void,
  handledActionKeys: Set<string>
): Iterable<string> {
  const indexRoute = group.all.find(r => r.crudRole === 'index')
  const defaultInvs = indexRoute ? [`          QueryKey.${group.groupName}.${group.listKeyFn},`] : []
  const createRoute = group.all.find(r => r.crudRole === 'create')
  const updateRoute = group.all.find(r => r.crudRole === 'update')
  const deleteRoute = group.all.find(r => r.crudRole === 'delete')
  if (createRoute) {
    yield* lowerMutationSlot('create', createRoute, defaultInvs, addInvs)
    handledActionKeys.add('create')
  }
  if (updateRoute) {
    yield* lowerMutationSlot('update', updateRoute, defaultInvs, addInvs)
    handledActionKeys.add('update')
  }
  if (deleteRoute) {
    yield* lowerMutationSlot('remove', deleteRoute, defaultInvs, addInvs)
    handledActionKeys.add('remove')
  }
}

function* lowerGroupCacheLines(
  group: ResourceGroupDescriptor<ClassifiedRoute>,
  addInvs: (route: ClassifiedRoute, invs: string[]) => void
): Iterable<string> {
  const handledActionKeys = new Set<string>()

  // 1. Variant-specific cache lowering (pure dataflow based on group.kind)
  switch (group.kind) {
    case ResourceGroupKind.FullCrud:
      yield* lowerFullCrudCache(group, addInvs)
      handledActionKeys.add('create')
      handledActionKeys.add('update')
      handledActionKeys.add('remove')
      break
    case ResourceGroupKind.ReadOnlyCrud:
      yield* lowerReadOnlyCrudCache(group)
      break
    case ResourceGroupKind.FlexibleCrud:
      yield* lowerFlexibleCrudCache(group, addInvs)
      if (group.create.available) handledActionKeys.add('create')
      if (group.update.available) handledActionKeys.add('update')
      if (group.delete.available) handledActionKeys.add('remove')
      break
    case ResourceGroupKind.Singleton:
      yield* lowerSingletonCache(group, addInvs, handledActionKeys)
      break
    case ResourceGroupKind.Custom:
      yield* lowerCustomCache(group, addInvs, handledActionKeys)
      break
  }

  // 2. Extra non-GET mutation routes
  for (const route of group.all) {
    if (route.method === 'GET') continue
    if (['create', 'update', 'remove'].includes(route.actionName)) continue
    // updateSelf / deleteSelf sudah di-handle oleh defineHooks via put/patch/delete no-param
    if (['put', 'patch'].includes(route.actionName) && route.crudRole === 'update') continue
    if (route.actionName === 'delete' && route.crudRole === 'delete' && !route.hasTrailingParam) continue
    if (handledActionKeys.has(route.actionName)) continue

    const invs: string[] = []
    if (group.isCrud) {
      pushUnique(invs, `          QueryKey.${group.groupName}.${group.listKeyFn},`)
    }
    const customGets = group.all.filter(r => r.method === 'GET')
    for (const getRoute of customGets) {
      const hasKey = !group.isCrud || getRoute.crudRole === 'custom'
      if (hasKey) {
        pushUnique(invs, `          QueryKey.${group.groupName}.${getRoute.actionName},`)
      }
    }
    addInvs(route, invs)

    yield `      ${route.actionName}: {`
    yield `        invalidate: [`
    for (const inv of invs) {
      yield inv
    }
    yield `        ],`
    yield `      },`
    handledActionKeys.add(route.actionName)
  }
}

function* lowerGroupHookConfig(
  group: ResourceGroupDescriptor<ClassifiedRoute>,
  addInvs: (route: ClassifiedRoute, invs: string[]) => void
): Iterable<string> {
  const { groupName } = group
  yield `  ${groupName}: {`
  yield `    types: {`
  yield `      list: typeOf<${group.types.list}>(),`
  yield `      detail: typeOf<${group.types.detail}>(),`
  yield `      create: typeOf<${group.types.create}>(),`
  yield `      update: typeOf<${group.types.update}>(),`
  if (group.types.hasCustomError) {
    yield `      error: typeOf<${group.types.error}>(),`
  }
  yield `    },`
  yield ``
  yield `    queryKey: QueryKey.${groupName},`

  const actionKeyLines = group.all.map(
    route => `      ${toNormalizedActionKey(route)}: QueryKey.${groupName}.${route.actionName},`
  )
  if (actionKeyLines.length > 0) {
    yield `    actionKeys: {`
    for (const line of actionKeyLines) {
      yield line
    }
    yield `    },`
  }
  yield `    endpoint: api.${groupName},`

  const cacheLines = [...lowerGroupCacheLines(group, addInvs)]
  if (cacheLines.length > 0) {
    yield ``
    yield `    cache: {`
    for (const line of cacheLines) {
      yield line
    }
    yield `    },`
  }

  yield `  },`
}

export function* lowerRuntimeManifestSource(manifest: RouteManifest): Iterable<string> {
  yield `// Auto-generated by routesync. Do not edit manually.`
  yield ``
  yield `export const runtimeManifest = {`
  yield `  resources: {},`
  yield `  domains: ${JSON.stringify(manifest.frontend?.domains || {}, null, 2)},`
  yield `  intents: {}`
  yield `} as const`
  yield ``
}

export function* lowerHookSource(
  graph: ClassifiedDomainGraph<ClassifiedRoute>,
  manifest: RouteManifest
): Iterable<string> {
  const importedTypes = new Set<string>()
  const contractImportedTypes = new Set<string>()

  for (const group of graph.resourceGroupGraph.all) {
    for (const t of group.types.importedTypes) importedTypes.add(t)
    for (const t of group.types.contractImportedTypes) contractImportedTypes.add(t)
  }

  yield `// Auto-generated by routesync. Do not edit manually.`
  yield ``
  yield `import { defineHooks, useAggregateCollectionIntent } from 'routesync/react'`
  yield `import { api } from './api'`
  yield `import { QueryKey } from './query-key'`
  yield `import { runtimeManifest } from './routesync.runtime'`

  if (importedTypes.size > 0) {
    yield `import type {`
    for (const t of Array.from(importedTypes).sort()) {
      yield `  ${t},`
    }
    yield `} from './types/index'`
  }

  if (contractImportedTypes.size > 0) {
    yield `import type {`
    for (const t of Array.from(contractImportedTypes).sort()) {
      yield `  ${t},`
    }
    yield `} from './contract/api-schema'`
  }

  yield ``
  yield `export const typeOf = <T>() => ({} as T)`
  yield ``
  yield `const baseHooks = defineHooks({`

  for (const group of graph.resourceGroupGraph.all) {
    yield* lowerGroupHookConfig(group, addRouteInvalidations)
  }

  yield `}, runtimeManifest)`
  yield ``
  yield `export const hooks = baseHooks`
  yield ``

  for (const group of graph.resourceGroups) {
    const { groupName, titleName } = group
    const primaryRoute =
      group.all.find(r => r.crudRole === 'show') ??
      group.all.find(r => r.crudRole === 'index') ??
      group.all[0]
    if (primaryRoute) {
      yield `/**`
      yield ` * @provenance ${primaryRoute.contract.provenance.summary}`
      if (primaryRoute.contract.provenance.route?.file) {
        yield ` * @see ${primaryRoute.contract.provenance.route.file}#L${primaryRoute.contract.provenance.route.line}`
      }
      yield ` */`
    }
    yield `export const use${titleName} = hooks.${groupName}`
  }

  yield ``
  yield `export * from './query-key'`
  yield ``
}

export class HookGenerator {
  static async generate(
    manifest: RouteManifest,
    outputDir?: string,
    domainGraph?: ClassifiedDomainGraph<ClassifiedRoute>
  ): Promise<string> {
    const graph = domainGraph ?? classifyDomainGraph(manifest)

    if (outputDir) {
      const runtimeWriter = new CodeWriter()
      runtimeWriter.write(lowerRuntimeManifestSource(manifest))
      await runtimeWriter.writeToFile(path.join(outputDir, 'routesync.runtime.ts'))
    }

    const hookWriter = new CodeWriter()
    hookWriter.write(lowerHookSource(graph, manifest))
    const result = hookWriter.toString()

    if (outputDir) {
      await hookWriter.writeToFile(path.join(outputDir, 'hooks.ts'))
    }

    return result
  }
}
