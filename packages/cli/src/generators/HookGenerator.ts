import { RouteManifest } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'
import { toTypeName } from './names'
import { classifyRoutes, buildResourceMap, ClassifiedRoute } from './route-classifier'
import { CANONICAL_ACTION_MAP } from './canonical-names'

export class HookGenerator {
  static async generate(manifest: RouteManifest, outputDir?: string): Promise<string> {
    const classified = classifyRoutes(manifest.routes, manifest.frontend?.groupAliases)
    const resources = buildResourceMap(classified)

    const importedTypes = new Set<string>()
    const contractImportedTypes = new Set<string>()
    const configBlocks: string[] = []
    const hasResource = (name: string): boolean => resources.has(name)

    for (const [groupName, resource] of resources) {
      const TitleGroup = toTypeName(groupName)
      const formName = `${TitleGroup}Form`

      const capitalize = (value: string): string =>
        value.charAt(0).toUpperCase() + value.slice(1)

      const hasSchema = (route?: any): boolean =>
        !!(route?.raw.schema?.rules && Object.keys(route.raw.schema.rules).length > 0)

      const resolveFormType = (route?: any): string | null => {
        if (!route || !hasSchema(route)) return null
        const rawAction = route.actionName
        const actionKey = (CANONICAL_ACTION_MAP as Record<string, string>)[rawAction] || capitalize(rawAction)
        // Standard form actions that are guaranteed to exist in the generated Form type
        const standardFormActions = ['Create', 'Update', 'Get']
        if (standardFormActions.includes(actionKey)) {
          importedTypes.add(formName)
          return `${formName}['${actionKey}']`
        }
        // Non-standard action — fall back to contract payload type
        const contractType = `${toTypeName(route.groupName)}${actionKey}Payload`
        contractImportedTypes.add(contractType)
        return contractType
      }

      const resolveResponseType = (route?: any): string => {
        if (!route || !route.raw?.response) return 'never'

        // 1. Authoritative SSOT from ResponseDescriptor
        if (route.raw.response.readTypeName) {
          const readType = route.raw.response.readTypeName
          if (readType !== 'void' && readType !== 'unknown') {
            importedTypes.add(readType)
          }
          return readType
        }

        // 2. Deterministic fallback for legacy plain JSON manifests
        const rawResp = route.raw.response
        const rawTarget = rawResp.resource || rawResp.model || rawResp.resolved?.resource || rawResp.resolved?.model
        const base = rawTarget ? toTypeName(rawTarget) : toTypeName(route.groupName)
        const isCollection = Boolean(rawResp.collection ?? rawResp.resolved?.collection)
        const readType = isCollection ? `${base}Index` : `${base}Show`
        importedTypes.add(readType)
        return readType
      }

      const pushUnique = (items: string[], item: string): void => {
        if (!items.includes(item)) items.push(item)
      }

      // Build set of auth-protected resource groups (dari manifest routes)
      const authGroups = new Set<string>()
      const resourceResponseModels = new Map<string, string>() // groupName → response model name
      for (const r of classified) {
        if (r.raw.auth) authGroups.add(r.groupName)
        // Track response model per resource untuk cross-resource invalidation
        const respKind = r.raw.response?.resolved?.kind || r.raw.response?.semantic?.kind || r.raw.response?.kind
        if (respKind === 'model' || respKind === 'resource') {
          const model = r.raw.response?.resolved?.model || r.raw.response?.semantic?.model
            || r.raw.response?.resolved?.resource || r.raw.response?.semantic?.resource
          if (model && !resourceResponseModels.has(r.groupName)) {
            resourceResponseModels.set(r.groupName, model)
          }
        }
      }

      // Build Eloquent relation lookup from manifest models
      const modelRelations: Record<string, Record<string, { type: string; model: string }>> = {}
      if (manifest.models) {
        for (const m of manifest.models) {
          if (m.relations) modelRelations[m.name] = m.relations
        }
      }

      // Reverse index: model name → [groupNames that return this model]
      const modelToGroups = new Map<string, string[]>()
      for (const [group, model] of resourceResponseModels) {
        if (!modelToGroups.has(model)) modelToGroups.set(model, [])
        if (!modelToGroups.get(model)!.includes(group)) {
          modelToGroups.get(model)!.push(group)
        }
      }

      const addCrossResourceInvalidations = (actionRouteOrName: any, invs: string[]): void => {
        let route = actionRouteOrName;
        switch (typeof actionRouteOrName === 'string') {
          case true: {
            const byKey = resource[actionRouteOrName];
            switch (byKey !== undefined) {
              case true:
                route = byKey;
                break;
              case false: {
                const found = resource.all?.find((r: any) => r.actionName === actionRouteOrName);
                switch (found !== undefined) {
                  case true:
                    route = found;
                    break;
                  case false:
                    break;
                }
                break;
              }
            }
            break;
          }
          case false:
            break;
        }

        switch (route?.raw !== undefined) {
          case true:
            route = route.raw;
            break;
          case false:
            break;
        }

        const expressions = route?.invalidation?.queryKeyExpressions;
        switch (expressions !== undefined) {
          case true:
            for (const expr of expressions) {
              pushUnique(invs, `          ${expr},`);
            }
            break;
          case false:
            break;
        }
      };

      // 1. Resolve list (index) type
      let listType = 'never'
      if (resource.index) {
        listType = resolveResponseType(resource.index)
      }

      // 2. Resolve detail (show) type
      let detailType = 'never'
      if (resource.show) {
        detailType = resolveResponseType(resource.show)
      } else {
        const customGet = resource.all.find(
          r => r.method === 'GET' && r.crudRole === 'custom'
        )
        if (customGet) {
          detailType = resolveResponseType(customGet)
        }
      }

      // 3. Resolve create type
      let createType = 'never'
      if (resource.create) {
        createType = resolveFormType(resource.create) || 'void'
      } else {
        // Fallback: custom POST route with schema (e.g. POST /produk/{id}/reviews)
        const customPost = resource.all.find(
          r => r.method === 'POST' && r.crudRole === 'custom' && hasSchema(r)
        )
        // Fallback: custom GET route with schema (e.g. GET /oauth/{provider}/redirect?redirect_to=)
        const customGet = resource.all.find(
          r => r.method === 'GET' && r.crudRole === 'custom' && hasSchema(r)
        )
        const fallback = customPost ?? customGet
        if (fallback) {
          createType = resolveFormType(fallback) || 'void'
        }
      }

      // 4. Resolve update type
      let updateType = 'never'
      if (resource.update) {
        updateType = resolveFormType(resource.update) || 'void'
      } else {
        const customUpdate = resource.all.find(
          r => ['PUT', 'PATCH'].includes(r.method) && r.crudRole === 'custom' && hasSchema(r)
        )
        if (customUpdate) {
          updateType = resolveFormType(customUpdate) || 'void'
        }
      }

      const errorTypes = new Set<string>()
      for (const route of resource.all) {
        const errorList = route.raw?.contract?.response?.errors ?? route.raw?.errorResponses ?? []
        for (const err of errorList) {
          if (err.typeName) {
            errorTypes.add(err.typeName)
            importedTypes.add(err.typeName)
          }
        }
      }
      const errorUnionType = errorTypes.size > 0
        ? Array.from(errorTypes).sort().join(' | ')
        : 'ApiError'

      const blockLines: string[] = []
      blockLines.push(`  ${groupName}: {`)
      blockLines.push(`    types: {`)
      blockLines.push(`      list: typeOf<${listType}>(),`)
      blockLines.push(`      detail: typeOf<${detailType}>(),`)
      blockLines.push(`      create: typeOf<${createType}>(),`)
      blockLines.push(`      update: typeOf<${updateType}>(),`)
      if (errorUnionType !== 'ApiError') {
        blockLines.push(`      error: typeOf<${errorUnionType}>(),`)
      }
      blockLines.push(`    },`)
      blockLines.push(``)
      blockLines.push(`    queryKey: QueryKey.${groupName},`)
      const toNormalizedActionKey = (route: ClassifiedRoute): string => {
        if (route.crudRole === 'update') return 'update'
        if (route.crudRole === 'delete') return 'remove'
        return route.actionName
      }
      const actionKeyLines = resource.all
        .map(route => `      ${toNormalizedActionKey(route)}: QueryKey.${groupName}.${route.actionName},`)
      if (actionKeyLines.length > 0) {
        blockLines.push(`    actionKeys: {`)
        blockLines.push(actionKeyLines.join('\n'))
        blockLines.push(`    },`)
      }
      blockLines.push(`    endpoint: api.${groupName},`)

      const isCrudKey = !!(resource.index && resource.show)

      const cacheLines: string[] = []
      if (resource.index) {
        const listKeyFn = isCrudKey ? 'lists' : 'list'
        cacheLines.push(`      list: QueryKey.${groupName}.${listKeyFn},`)
      }
      if (resource.show) {
        const detailKeyFn = isCrudKey ? 'detail' : resource.show.actionName
        cacheLines.push(`      detail: QueryKey.${groupName}.${detailKeyFn},`)
      }
      if (resource.create) {
        const invs: string[] = []
        if (resource.index) {
          const listKeyFn = isCrudKey ? 'lists' : 'list'
          pushUnique(invs, `          QueryKey.${groupName}.${listKeyFn},`)
        }
        addCrossResourceInvalidations('create', invs)

        if (invs.length > 0) {
          cacheLines.push(`      create: {`)
          cacheLines.push(`        invalidate: [`)
          cacheLines.push(invs.join('\n'))
          cacheLines.push(`        ],`)
          cacheLines.push(`      },`)
        }
      }
      if (resource.update) {
        const invs: string[] = []
        if (resource.index) {
          const listKeyFn = isCrudKey ? 'lists' : 'list'
          pushUnique(invs, `          QueryKey.${groupName}.${listKeyFn},`)
        }
        if (resource.show) {
          const detailKeyFn = isCrudKey ? 'detail' : resource.show.actionName
          pushUnique(invs, `          QueryKey.${groupName}.${detailKeyFn},`)
        }
        addCrossResourceInvalidations('update', invs)

        if (invs.length > 0) {
          cacheLines.push(`      update: {`)
          cacheLines.push(`        invalidate: [`)
          cacheLines.push(invs.join('\n'))
          cacheLines.push(`        ],`)
          cacheLines.push(`      },`)
        }
      }

      const hasDelete = resource.delete
      if (hasDelete) {
        const invs: string[] = []
        if (resource.index) {
          const listKeyFn = isCrudKey ? 'lists' : 'list'
          pushUnique(invs, `          QueryKey.${groupName}.${listKeyFn},`)
        }
        addCrossResourceInvalidations('delete', invs)

        if (invs.length > 0) {
          cacheLines.push(`      remove: {`)
          cacheLines.push(`        invalidate: [`)
          cacheLines.push(invs.join('\n'))
          cacheLines.push(`        ],`)
          cacheLines.push(`      },`)
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
          const listKeyFn = isCrudKey ? 'lists' : 'list'
          pushUnique(invs, `          QueryKey.${groupName}.${listKeyFn},`)
        }
        const customGets = resource.all.filter(r => r.method === 'GET')
        for (const getRoute of customGets) {
          const hasKey = !isCrudKey || getRoute.crudRole === 'custom'
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
