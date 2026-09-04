import { RouteManifest } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'
import { classifyRoutes, buildGroupedRoutes } from './route-classifier'
import { ConstantsGenerator } from './ConstantsGenerator'
import { CANONICAL_ACTION_MAP } from './canonical-names'

export class SDKGenerator {
  static async generate(manifest: RouteManifest, outputDir?: string, options: Record<string, unknown> = {}): Promise<string> {
    const classified = classifyRoutes(manifest.routes, manifest.frontend?.groupAliases)
    const grouped = buildGroupedRoutes(classified)
    const apiBodyLines: string[] = []

    const usesZod = Boolean(options.zod);

    // Response counting (sama dengan contract)
    const sdkRespCount = new Map<string, number>()
    for (const route of classified) {
      if (route.raw.response) {
        const r = route.groupName
        sdkRespCount.set(r, (sdkRespCount.get(r) || 0) + 1)
      }
    }

    const knownModels = new Set(manifest.models?.map(m => m.name) || [])
    const knownResources = new Set(manifest.resources?.map(r => r.name) || [])

    const usedSchemas = new Set<string>()
    const usedContracts = new Set<string>()
    const usedPayloadContracts = new Set<string>()
    const usedMappers = new Set<string>()

    // Helper to extract response type, schema and mapper info
    const getResponseInfo = (rawMeta: any, rawRoute: any, keyName: string): { type: string, schema: string, mapper: string | null } => {
      let schemaStr = 'undefined'
      if (rawRoute.response && usesZod) {
        schemaStr = rawRoute.response.validatorName ?? `validate${keyName}Response`
      }

      if (rawRoute.response?.readTypeName && rawRoute.response?.mapperName) {
        const isVoid = rawRoute.response.readTypeName === 'void'
        const typeStr = isVoid ? 'void' : `Read.${rawRoute.response.readTypeName}`
        const mapperStr = rawRoute.response.mapperName === 'identity' ? null : rawRoute.response.mapperName
        if (mapperStr) usedMappers.add(mapperStr)
        return { type: typeStr, schema: schemaStr, mapper: mapperStr }
      }

      if (!rawMeta) return { type: 'unknown', schema: schemaStr, mapper: null }
      const meta = {
        ...(rawMeta.resolved || rawMeta.semantic || rawMeta),
        collection: rawMeta.collection ?? rawMeta.resolved?.collection ?? rawMeta.semantic?.collection,
        paginated: rawMeta.paginated ?? rawMeta.resolved?.paginated ?? rawMeta.semantic?.paginated
      }
      if (meta.kind === 'unknown') return { type: 'unknown', schema: schemaStr, mapper: null }
      
      let baseModel = ''
      let isModel = false
      let isResource = false
      
      const resolvedKind = meta.kind || meta.type
      if (resolvedKind === 'model') {
        baseModel = meta.model
        const resourceName = `${meta.model}Resource`
        if (knownResources.has(resourceName)) {
          baseModel = resourceName
          isResource = true
        } else if (knownModels.has(meta.model)) {
          isModel = true
        }
      } else if (resolvedKind === 'resource') {
        baseModel = meta.resource
        if (knownResources.has(meta.resource)) {
          isResource = true
        }
      }
      
      if (isModel || isResource) {
        const isCollection = !!(meta.collection ?? rawMeta.collection)
        const isPaginated = !!(meta.paginated ?? rawMeta.paginated)
        
        let typeStr = `Read.${baseModel}Show`
        let mapperStr = `to${baseModel}Read`
        let localSchema = schemaStr
        if (!isCollection && usesZod) {
          localSchema = `validate${baseModel}`
        }
        
        if (isCollection) {
          if (isPaginated) {
            typeStr = `{ data: Read.${baseModel}Show[], currentPage?: number, total?: number }`
            mapperStr = `(res: any) => ({ ...res, data: to${baseModel}ReadList(res.data) })`
            usedMappers.add(`to${baseModel}ReadList`)
          } else {
            typeStr = `Read.${baseModel}Index`
            mapperStr = `to${keyName}ResponseRead`
            usedMappers.add(`to${keyName}ResponseRead`)
          }
        } else {
          usedMappers.add(`to${baseModel}Read`)
        }
        return { type: typeStr, schema: localSchema, mapper: mapperStr }
      }
      
      let typeStr = 'unknown'
      if (meta.kind === 'primitive') {
        typeStr = meta.type || 'unknown'
        return { type: typeStr, schema: schemaStr, mapper: null }
      }
      else if (meta.kind === 'object' && meta.fields) {
        const fieldsInfo = Object.entries(meta.fields).map(([k, v]) => {
          return { key: k, info: getResponseInfo(v, rawRoute, keyName) }
        })
        
        typeStr = `{ ${fieldsInfo.map(f => `${f.key}: ${f.info.type}`).join(', ')} }`
        
        // Check if any sub-field has a mapper, or if any nested field name is snake_case
        // (the latter means ZodTierGenerator will generate a camelCase mapper for it)
        const hasNestedSnakeCaseKey = (rawMeta: any): boolean => {
          if (!rawMeta) return false
          const m = rawMeta.resolved || rawMeta.semantic || rawMeta
          if (m.fields) {
            for (const [k, v] of Object.entries(m.fields as Record<string, any>)) {
              if (k.includes('_')) return true
              if (hasNestedSnakeCaseKey(v)) return true
            }
          }
          return false
        }
        const hasSubMapper = fieldsInfo.some(f => f.info.mapper !== null) || hasNestedSnakeCaseKey(rawMeta)
        let mapperStr: string | null = null
        if (hasSubMapper) {
          mapperStr = `to${keyName}ResponseRead`
        }
        
        return { type: typeStr, schema: schemaStr, mapper: mapperStr }
      }
      
      if (meta.collection) {
        typeStr = `${typeStr}[]`
      }
      
      return { type: typeStr, schema: schemaStr, mapper: null }
    }

    // Generate api object body
    apiBodyLines.push(`export const api = defineApi({`)

    for (const [groupName, routes] of Object.entries(grouped)) {
      apiBodyLines.push(`  ${groupName}: {`)

      for (const route of routes) {
        const TitleCaseGroup = groupName.charAt(0).toUpperCase() + groupName.slice(1)
        const rawAction = (CANONICAL_ACTION_MAP as Record<string, string>)[route.actionName] || (route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1))
        const KeyName = `${TitleCaseGroup}${rawAction}`

        // Response naming: LoginResponse (single) atau ProfileUpdateResponse (multiple)
        const resourceGroup = route.groupName
        const respCount = sdkRespCount.get(resourceGroup) || 1
        const respKey = respCount === 1 ? TitleCaseGroup : KeyName

        const SchemaName = `${KeyName}PayloadSchema`
        const respInfo = getResponseInfo(route.raw.response, route.raw, respKey)

        apiBodyLines.push(`    ${route.actionName}: endpoint({`)
        apiBodyLines.push(`      method: '${route.method}',`)

        const routeKey = ConstantsGenerator.getRouteKey(route.raw.path)
        apiBodyLines.push(`      path: API_ENDPOINTS.${routeKey},`)
        if (route.raw.auth) apiBodyLines.push(`      auth: true,`)
        
        const hasBodyContract = Boolean(options.zod && route.raw.schema && route.raw.schema.rules);
        const hasRespContract = Boolean(options.zod && route.raw.response);

        switch (hasBodyContract || hasRespContract) {
          case true: {
            apiBodyLines.push(`      contract: {`);
            switch (hasBodyContract) {
              case true: {
                const bodyValidator = `validate${KeyName}Payload`;
                apiBodyLines.push(`        body: ${bodyValidator},`);
                usedPayloadContracts.add(bodyValidator);
                break;
              }
              case false:
                break;
            }
            switch (hasRespContract) {
              case true:
                apiBodyLines.push(`        response: ${respInfo.schema},`);
                switch (respInfo.schema !== 'undefined') {
                  case true:
                    usedContracts.add(respInfo.schema);
                    break;
                  case false:
                    break;
                }
                break;
              case false:
                break;
            }
            apiBodyLines.push(`      },`);
            break;
          }
          case false:
            break;
        }

        const hasBodyMapper = Boolean(route.raw.schema && route.raw.schema.rules && usesZod);
        const hasRespMapper = Boolean(respInfo.mapper);

        switch (hasBodyMapper || hasRespMapper) {
          case true: {
            apiBodyLines.push(`      mapper: {`);
            switch (hasRespMapper) {
              case true:
                apiBodyLines.push(`        response: ${respInfo.mapper},`);
                switch (Boolean(respInfo.mapper)) {
                  case true:
                    switch (respInfo.mapper.startsWith('(')) {
                      case true:
                        break;
                      case false:
                        usedMappers.add(respInfo.mapper);
                        break;
                    }
                    break;
                  case false:
                    break;
                }
                break;
              case false:
                break;
            }
            switch (hasBodyMapper) {
              case true: {
                const bodyMapperName = `toApi${KeyName}`;
                apiBodyLines.push(`        body: ${bodyMapperName},`);
                usedMappers.add(bodyMapperName);
                break;
              }
              case false:
                break;
            }
            apiBodyLines.push(`      },`);
            break;
          }
          case false:
            break;
        }
        
        apiBodyLines.push(`    }),`)
      }

      apiBodyLines.push(`  },`)
    }

    apiBodyLines.push(`})`)

    // Write all to file with dynamic imports
    const lines: string[] = []
    lines.push(`// Auto-generated by routesync. Do not edit manually.`)
    lines.push(`// Generated at: ${manifest.generatedAt}`)
    lines.push(``)
    lines.push(`import { defineApi, endpoint } from 'routesync'`)
    lines.push(`import { API_URL, API_ENDPOINTS, ROUTES, Enums } from './constants'`)

    if (usedContracts.size > 0) {
      lines.push(`import { ${Array.from(usedContracts).sort().join(', ')} } from './contract/api-contract'`)
    }
    if (usedPayloadContracts.size > 0) {
      lines.push(`import { ${Array.from(usedPayloadContracts).sort().join(', ')} } from './contract/api-schema'`)
    }
    if (usedMappers.size > 0) {
      lines.push(`import { ${Array.from(usedMappers).sort().join(', ')} } from './mappers/api-mapper'`)
    }
    lines.push(``)

    lines.push(...apiBodyLines)
    lines.push(``)
    lines.push(`export default api`)
    lines.push(``)

    const result = lines.join('\n')
    if (outputDir) {
      await fs.writeFile(path.join(outputDir, 'api.ts'), result)
    }
    return result
  }
}