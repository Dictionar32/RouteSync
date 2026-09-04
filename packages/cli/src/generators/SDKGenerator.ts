import { RouteManifest, EndpointContract } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'
import { toTypeName } from './names'
import { classifyRoutes, buildGroupedRoutes } from './route-classifier'
import { ConstantsGenerator } from './ConstantsGenerator'
import { CANONICAL_ACTION_MAP } from './canonical-names'

export class SDKGenerator {
  static async generate(manifest: RouteManifest, outputDir?: string, options: Record<string, unknown> = {}): Promise<string> {
    const classified = classifyRoutes(manifest.routes, manifest.frontend?.groupAliases)
    const grouped = buildGroupedRoutes(classified)
    const apiBodyLines: string[] = []

    const usesZod = Boolean(options.zod);

    const usedContracts = new Set<string>()
    const usedPayloadContracts = new Set<string>()
    const usedMappers = new Set<string>()

    // Authoritative SSOT from EndpointContract
    const resolveResponseInfo = (contract: EndpointContract, keyName: string): { type: string, schema: string, mapper: string | null } => {
      let schemaStr = 'undefined'
      if (contract.response?.success?.validatorName && usesZod) {
        schemaStr = contract.response.success.validatorName
      }

      if (contract.response?.success?.readTypeName) {
        const isVoid = contract.response.success.readTypeName === 'void'
        const typeStr = isVoid ? 'void' : `Read.${contract.response.success.readTypeName}`
        const mapperName = contract.response.success.mapperName
        const mapperStr = (!mapperName || mapperName === 'identity') ? null : mapperName
        if (mapperStr) usedMappers.add(mapperStr)
        return { type: typeStr, schema: schemaStr, mapper: mapperStr }
      }

      return { type: 'unknown', schema: schemaStr, mapper: null }
    }

    // Generate api object body
    apiBodyLines.push(`export const api = defineApi({`)

    for (const [groupName, routes] of Object.entries(grouped)) {
      apiBodyLines.push(`  ${groupName}: {`)

      for (const route of routes) {
        const TitleCaseGroup = groupName.charAt(0).toUpperCase() + groupName.slice(1)
        const rawAction = (CANONICAL_ACTION_MAP as Record<string, string>)[route.actionName] || (route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1))
        const KeyName = `${TitleCaseGroup}${rawAction}`

        const respInfo = resolveResponseInfo(route.contract, KeyName)

        apiBodyLines.push(`    ${route.actionName}: endpoint({`)
        apiBodyLines.push(`      method: '${route.method}',`)

        const routeKey = ConstantsGenerator.getRouteKey(route.raw.path)
        apiBodyLines.push(`      path: API_ENDPOINTS.${routeKey},`)
        if (route.raw.auth) apiBodyLines.push(`      auth: true,`)
        
        const hasBodyContract = Boolean(options.zod && route.contract.request.hasBody);
        const hasRespContract = Boolean(options.zod && route.contract.response.success);

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