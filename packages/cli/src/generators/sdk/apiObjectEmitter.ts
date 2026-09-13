/**
 * apiObjectEmitter.ts
 *
 * Emits the defineApi endpoint entries for each classified route group.
 *
 * @module cli/generators/sdk
 */

import type { ClassifiedRoute } from '../route-classifier';
import { ConstantsGenerator } from '../ConstantsGenerator';
import { CANONICAL_ACTION_MAP } from '../canonical-names';
import { resolveEndpointResponseInfo } from './endpointResolver';

export interface ApiObjectEmitterContext {
  readonly usesZod: boolean;
  readonly usedContracts: Set<string>;
  readonly usedPayloadContracts: Set<string>;
  readonly usedMappers: Set<string>;
}

export function emitApiObjectLines(
  grouped: Record<string, ClassifiedRoute[]>,
  ctx: ApiObjectEmitterContext
): string[] {
  const apiBodyLines: string[] = [];
  apiBodyLines.push('export const api = defineApi({');

  for (const [groupName, routes] of Object.entries(grouped)) {
    apiBodyLines.push(`  ${groupName}: {`);

    for (const route of routes) {
      const TitleCaseGroup = groupName.charAt(0).toUpperCase() + groupName.slice(1);
      const rawAction = (CANONICAL_ACTION_MAP as Record<string, string>)[route.actionName] || (route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1));
      const KeyName = `${TitleCaseGroup}${rawAction}`;

      const respInfo = resolveEndpointResponseInfo(route.contract, ctx.usesZod, ctx.usedMappers);

      const provenance = route.contract.provenance;
      if (provenance) {
        apiBodyLines.push('    /**');
        apiBodyLines.push(`     * @provenance ${provenance.summary}`);
        if (provenance.route?.file) {
          apiBodyLines.push(`     * @see ${provenance.route.file}#L${provenance.route.line}`);
        }
        apiBodyLines.push('     */');
      }

      apiBodyLines.push(`    ${route.actionName}: endpoint({`);
      apiBodyLines.push(`      method: '${route.method}',`);

      const routeKey = ConstantsGenerator.getRouteKey(route.raw.path);
      apiBodyLines.push(`      path: API_ENDPOINTS.${routeKey},`);
      if (route.raw.auth) apiBodyLines.push('      auth: true,');

      const hasBodyContract = Boolean(ctx.usesZod && route.contract.request.hasBody);
      const hasRespContract = Boolean(ctx.usesZod && route.contract.response.success);

      if (hasBodyContract || hasRespContract) {
        apiBodyLines.push('      contract: {');
        if (hasBodyContract) {
          const bodyValidator = `validate${KeyName}Payload`;
          apiBodyLines.push(`        body: ${bodyValidator},`);
          ctx.usedPayloadContracts.add(bodyValidator);
        }
        if (hasRespContract) {
          apiBodyLines.push(`        response: ${respInfo.schema},`);
          if (respInfo.schema !== 'undefined') {
            ctx.usedContracts.add(respInfo.schema);
          }
        }
        apiBodyLines.push('      },');
      }

      const hasBodyMapper = Boolean(route.raw.schema && route.raw.schema.rules && ctx.usesZod);
      const hasRespMapper = Boolean(respInfo.mapper);

      if (hasBodyMapper || hasRespMapper) {
        apiBodyLines.push('      mapper: {');
        if (hasRespMapper) {
          apiBodyLines.push(`        response: ${respInfo.mapper},`);
          if (respInfo.mapper && !respInfo.mapper.startsWith('(')) {
            ctx.usedMappers.add(respInfo.mapper);
          }
        }
        if (hasBodyMapper) {
          const bodyMapperName = `toApi${KeyName}`;
          apiBodyLines.push(`        body: ${bodyMapperName},`);
          ctx.usedMappers.add(bodyMapperName);
        }
        apiBodyLines.push('      },');
      }

      apiBodyLines.push('    }),');
    }

    apiBodyLines.push('  },');
  }

  apiBodyLines.push('})');
  return apiBodyLines;
}
