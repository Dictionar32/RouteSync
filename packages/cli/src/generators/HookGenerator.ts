import { RouteManifest } from '@routesync/core'
import type { ResponseArtifact } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'
import { toTypeName } from './names'
import { classifyRoutes, buildResourceMap, ClassifiedRoute } from './route-classifier'
import { ResponseAnalysisHelper } from './response-analysis-helper'

export class HookGenerator {
  static async generate(manifest: RouteManifest, outputDir: string): Promise<void> {
    const classified = classifyRoutes(manifest.routes, manifest.frontend?.groupAliases)
    const resources = buildResourceMap(classified)

    // BUILD SSOT: ResponseArtifactMap from manifest
    console.log('🔨 HookGenerator: Building ResponseArtifactMap (SSOT)...')
    const responseArtifactMap = ResponseAnalysisHelper.buildResponseArtifactMap(manifest)

    const knownModels = new Set(manifest.models?.map(m => m.name) || [])
    const knownResources = new Set(manifest.resources?.map(r => r.name) || [])

    function resolveBaseResponseName(rawMeta: any): string | null {
      if (!rawMeta) return null
      const meta = {
        ...(rawMeta.resolved || rawMeta.semantic || rawMeta),
        collection: rawMeta.collection ?? rawMeta.resolved?.collection ?? rawMeta.semantic?.collection,
        paginated: rawMeta.paginated ?? rawMeta.resolved?.paginated ?? rawMeta.semantic?.paginated
      }
      if (meta.kind === 'unknown') return null

      const resolvedKind = meta.kind || meta.type
      if (resolvedKind === 'model') {
        const modelName = meta.model
        const resourceName = `${meta.model}Resource`
        if (knownResources.has(resourceName)) {
          return resourceName
        } else if (knownModels.has(modelName)) {
          return modelName
        }
        return modelName
      } else if (resolvedKind === 'resource') {
        return meta.resource || null
      } else if (resolvedKind === 'object' && meta.fields) {
        for (const val of Object.values(meta.fields)) {
          const name = resolveBaseResponseName(val)
          if (name) return name
        }
      }
      return null
    }

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

      // CRUD mapping untuk action names
      const ACTION_TO_CRUD_HOOK: Record<string, string> = {
        post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete',
      }

      const resolveFormType = (route?: any): string | null => {
        if (!route || !hasSchema(route)) return null
        const rawAction = route.actionName
        const actionKey = ACTION_TO_CRUD_HOOK[rawAction] || capitalize(rawAction)
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

      const resolveResponseInfo = (rawMeta: unknown): { baseName: string; collection: boolean } | null => {
        if (!rawMeta || typeof rawMeta !== 'object') return null
        const raw = rawMeta as Record<string, unknown>
        const resolved = (raw.resolved || raw.semantic || raw) as Record<string, unknown>
        const meta: Record<string, unknown> = {
          ...resolved,
          collection: raw.collection ?? (raw.resolved as Record<string, unknown> | undefined)?.collection ?? (raw.semantic as Record<string, unknown> | undefined)?.collection,
          fields: raw.fields ?? (raw.resolved as Record<string, unknown> | undefined)?.fields ?? (raw.semantic as Record<string, unknown> | undefined)?.fields,
        }
        if (meta.kind === 'unknown') return null

        const resolvedKind = meta.kind || meta.type
        if (resolvedKind === 'model') {
          const modelName = meta.model as string
          const resourceName = `${modelName}Resource`
          const baseName = knownResources.has(resourceName)
            ? resourceName
            : knownModels.has(modelName)
              ? modelName
              : modelName
          return { baseName, collection: !!meta.collection }
        }
        if (resolvedKind === 'resource' && meta.resource) {
          return { baseName: meta.resource as string, collection: !!meta.collection }
        }
        // object-kind: ZodTierGenerator membungkusnya dalam {GroupName}Transformed
        // Jangan rekursi ke inner model — gunakan tipe berbasis groupName dari api-read
        return null
      }

      const resolveResponseType = (route?: any): string => {
        if (!route) return 'never'

        const responseInfo = resolveResponseInfo(route.raw.response)
        if (!responseInfo) {
          if (!route.raw.response) return 'never'
          // Object response bukan model/resource → pakai Transformed type dari api-read
          const resourceName = toTypeName(route.groupName)

          // SSOT: Use ResponseArtifact instead of action name heuristic
          // Old way: const isList = route.actionName === 'list' || route.crudRole === 'index'  ❌
          // New way: Read from artifact
          const artifactId = `${route.name}.Response`
          const artifact = responseArtifactMap?.get(artifactId)
          const isList = artifact?.body && 'shape' in artifact.body
            ? (artifact.body.shape === 'collection' || artifact.body.shape === 'paginated')
            : false

          const readType = isList ? `${resourceName}Index` : `${resourceName}Show`
          importedTypes.add(readType)
          return readType
        }

        const responseType = responseInfo.collection ? `${responseInfo.baseName}Index` : `${responseInfo.baseName}Show`
        importedTypes.add(responseType)
        return responseType
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

      const addCrossResourceInvalidations = (actionName: string, invs: string[]): void => {
        // 1. Self-invalidation: mutasi → invalidate read queries resource sendiri
        const selfRes = resources.get(groupName)
        if (selfRes && actionName !== 'get' && actionName !== 'list') {
          if (selfRes.index) {
            const suffix = selfRes.show ? 'lists' : 'list'
            pushUnique(invs, `          QueryKey.${groupName}.${suffix},`)
          }
          // Custom GET routes (e.g., produkReviews.get) juga di-invalidate
          for (const r of (selfRes.all || [])) {
            if (r.method === 'GET' && r.actionName !== 'list') {
              pushUnique(invs, `          QueryKey.${groupName}.${r.actionName},`)
            }
          }
        }

        // 2. Cross-resource via shared response model
        const myModel = resourceResponseModels.get(groupName)
        if (myModel) {
          for (const [otherGroup, otherModel] of resourceResponseModels) {
            if (otherGroup !== groupName && otherModel === myModel) {
              const otherRes = resources.get(otherGroup)
              if (otherRes?.index) {
                const s = otherRes.show ? 'lists' : 'list'
                pushUnique(invs, `          QueryKey.${otherGroup}.${s},`)
              }
            }
          }
        }

        // 3. Sub-resource: adminProduk → produk (groupName prefix match)
        for (const [otherGroup, otherRes] of resources) {
          if (otherGroup !== groupName && groupName.includes(otherGroup) && otherRes.index) {
            const s = otherRes.show ? 'lists' : 'list'
            pushUnique(invs, `          QueryKey.${otherGroup}.${s},`)
          }
        }

        // 4. Logout → invalidate semua resource yang auth-protected
        if (groupName === 'logout') {
          for (const g of authGroups) {
            if (g === groupName) continue
            const res = resources.get(g)
            if (!res || !res.index) continue
            const suffix = res.show ? 'lists' : 'list'
            pushUnique(invs, `          QueryKey.${g}.${suffix},`)
          }
        }

        // 5. Eloquent relation traversal — belongsTo/hasOne/hasMany
        //    When mutating a model, invalidate queries that return related models
        const responseModel = resourceResponseModels.get(groupName)
        if (responseModel && modelRelations[responseModel]) {
          const relations = modelRelations[responseModel]
          for (const [, rel] of Object.entries(relations)) {
            // belongsTo: this model belongs to Parent → invalidate parent queries
            // e.g., Payment belongsTo Order → payment.post invalidates orders.*
            if (rel.type === 'belongsTo' && rel.model !== responseModel) {
              const parentGroups = modelToGroups.get(rel.model)
              if (parentGroups) {
                for (const pg of parentGroups) {
                  if (pg === groupName) continue
                  const parentRes = resources.get(pg)
                  if (parentRes?.index) {
                    const s = parentRes.show ? 'lists' : 'list'
                    pushUnique(invs, `          QueryKey.${pg}.${s},`)
                  }
                  if (parentRes?.show) {
                    pushUnique(invs, `          QueryKey.${pg}.detail,`)
                  }
                }
              }
            }
            // hasOne / hasMany: this model has children → invalidate child queries
            // e.g., ProdukItem hasMany Wishlist → adminProduk.create invalidates wishlist.*
            if ((rel.type === 'hasOne' || rel.type === 'hasMany') && rel.model !== responseModel) {
              const childGroups = modelToGroups.get(rel.model)
              if (childGroups) {
                for (const cg of childGroups) {
                  if (cg === groupName) continue
                  const childRes = resources.get(cg)
                  if (childRes?.index) {
                    const s = childRes.show ? 'lists' : 'list'
                    pushUnique(invs, `          QueryKey.${cg}.${s},`)
                  }
                }
              }
            }
          }
        }
      }

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

      const blockLines: string[] = []
      blockLines.push(`  ${groupName}: {`)
      blockLines.push(`    types: {`)
      blockLines.push(`      list: typeOf<${listType}>(),`)
      blockLines.push(`      detail: typeOf<${detailType}>(),`)
      blockLines.push(`      create: typeOf<${createType}>(),`)
      blockLines.push(`      update: typeOf<${updateType}>(),`)
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
    await fs.writeFile(path.join(outputDir, 'routesync.runtime.ts'), runtimeConfigLines.join('\n'))

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

    await fs.writeFile(path.join(outputDir, 'hooks.ts'), lines.join('\n'))
  }
}
