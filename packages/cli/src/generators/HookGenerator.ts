import { RouteManifest } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'
import { toTypeName } from './names'
import { classifyRoutes, buildResourceMap } from './route-classifier'

export class HookGenerator {
  static async generate(manifest: RouteManifest, outputDir: string): Promise<void> {
    const classified = classifyRoutes(manifest.routes)
    const resources  = buildResourceMap(classified)

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
    const configBlocks: string[] = []

    for (const [groupName, resource] of resources) {
      const TitleGroup = toTypeName(groupName)

      // 1. Resolve list (index) type
      let listType = 'never'
      if (resource.index) {
        const baseName = resolveBaseResponseName(resource.index.raw.response)
        if (baseName) {
          listType = `${baseName}Index`
          importedTypes.add(listType)
        } else {
          listType = 'unknown'
        }
      }

      // 2. Resolve detail (show) type
      let detailType = 'never'
      if (resource.show) {
        const baseName = resolveBaseResponseName(resource.show.raw.response)
        if (baseName) {
          detailType = `${baseName}Show`
          importedTypes.add(detailType)
        } else {
          detailType = 'unknown'
        }
      }

      // 3. Resolve create type
      let createType = 'never'
      if (resource.create) {
        const hasSchema = resource.create.raw.schema?.rules && Object.keys(resource.create.raw.schema.rules).length > 0
        if (hasSchema) {
          const formName = `${TitleGroup}Form`
          const actionCapitalized = resource.create.actionName.charAt(0).toUpperCase() + resource.create.actionName.slice(1)
          createType = `${formName}['${actionCapitalized}']`
          importedTypes.add(formName)
        } else {
          createType = 'any'
        }
      }

      // 4. Resolve update type
      let updateType = 'never'
      if (resource.update) {
        const hasSchema = resource.update.raw.schema?.rules && Object.keys(resource.update.raw.schema.rules).length > 0
        if (hasSchema) {
          const formName = `${TitleGroup}Form`
          const actionCapitalized = resource.update.actionName.charAt(0).toUpperCase() + resource.update.actionName.slice(1)
          updateType = `${formName}['${actionCapitalized}']`
          importedTypes.add(formName)
        } else {
          updateType = 'any'
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
          invs.push(`          QueryKey.${groupName}.${listKeyFn},`)
        }
        
        if (invs.length > 0) {
          cacheLines.push(`      create: {`)
          cacheLines.push(`        invalidate: [`)
          cacheLines.push(invs.join('\n'))
          cacheLines.push(`        ],`)
          cacheLines.push(`      },`)
        } else {
          cacheLines.push(`      create: {`)
          cacheLines.push(`        invalidate: [],`)
          cacheLines.push(`      },`)
        }
      }
      if (resource.update) {
        const invs: string[] = []
        if (resource.index) {
          const listKeyFn = isCrudKey ? 'lists' : 'list'
          invs.push(`          QueryKey.${groupName}.${listKeyFn},`)
        }
        if (resource.show) {
          const detailKeyFn = isCrudKey ? 'detail' : resource.show.actionName
          invs.push(`          QueryKey.${groupName}.${detailKeyFn},`)
        }
        
        if (invs.length > 0) {
          cacheLines.push(`      update: {`)
          cacheLines.push(`        invalidate: [`)
          cacheLines.push(invs.join('\n'))
          cacheLines.push(`        ],`)
          cacheLines.push(`      },`)
        } else {
          cacheLines.push(`      update: {`)
          cacheLines.push(`        invalidate: [],`)
          cacheLines.push(`      },`)
        }
      }
      
      const hasDelete = resource.delete
      if (hasDelete) {
        const invs: string[] = []
        if (resource.index) {
          const listKeyFn = isCrudKey ? 'lists' : 'list'
          invs.push(`          QueryKey.${groupName}.${listKeyFn},`)
        }
        
        if (invs.length > 0) {
          cacheLines.push(`      delete: {`)
          cacheLines.push(`        invalidate: [`)
          cacheLines.push(invs.join('\n'))
          cacheLines.push(`        ],`)
          cacheLines.push(`      },`)
        } else {
          cacheLines.push(`      delete: {`)
          cacheLines.push(`        invalidate: [],`)
          cacheLines.push(`      },`)
        }
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

    const lines: string[] = []
    lines.push(`// Auto-generated by routesync. Do not edit manually.`)
    lines.push(``)
    lines.push(`import { defineHooks } from 'routesync/react'`)
    lines.push(`import { api } from './api'`)
    lines.push(`import { QueryKey } from './query-key'`)

    if (importedTypes.size > 0) {
      lines.push(`import type {`)
      for (const t of Array.from(importedTypes).sort()) {
        lines.push(`  ${t},`)
      }
      lines.push(`} from './types'`)
    }

    lines.push(``)
    lines.push(`export const typeOf = <T>() => ({} as T)`)
    lines.push(``)
    lines.push(`export const hooks = defineHooks({`)
    lines.push(configBlocks.join('\n'))
    lines.push(`})`)
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
