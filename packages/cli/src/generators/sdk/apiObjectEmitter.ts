/**
 * apiObjectEmitter.ts
 *
 * Emits the defineApi endpoint entries for each classified route group.
 *
 * @module cli/generators/sdk
 */

import { operationIdentityReferenceFromCapability, routeParameterCapabilityReferenceFromRoute, routeParameterCapabilityReferencesFromRoute, routeTargetScopeFromRoute } from '@routesync/core';
import type { ClassifiedRoute } from '../route-capability-projection';
import { ConstantsGenerator } from '../ConstantsGenerator';
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
      // Action identity is already closed upstream. This is output identifier casing only.
      const rawAction = route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1);
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
      apiBodyLines.push(`      operationIdentity: ${JSON.stringify(operationIdentityReferenceFromCapability(route.raw.capability))},`);
      apiBodyLines.push(`      hookKind: '${route.raw.capability.hookKind}',`);
      apiBodyLines.push(`      payloadLocation: '${route.raw.capability.payloadLocation}',`);
      apiBodyLines.push(`      schemaRole: '${route.raw.capability.schemaRole}',`);
      apiBodyLines.push(`      crudRole: '${route.raw.capability.crudRole}',`);
      apiBodyLines.push(`      targetScope: '${routeTargetScopeFromRoute(route.raw)}',`);
      const routeParameter = routeParameterCapabilityReferenceFromRoute(route.raw);
      const routeParameters = routeParameterCapabilityReferencesFromRoute(route.raw);
      if (routeParameter) {
        apiBodyLines.push(`      routeParameter: ${JSON.stringify(routeParameter)},`);
      }
      if (routeParameters.length > 0) {
        apiBodyLines.push(`      routeParameters: ${JSON.stringify(routeParameters)},`);
      }

      const routeKey = ConstantsGenerator.getRouteKey(route.identity.coordinates.path.value);
      apiBodyLines.push(`      path: API_ENDPOINTS.${routeKey},`);
      if (route.contract.request.security.isProtected.value) apiBodyLines.push('      auth: true,');

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

      const hasBodyMapper = Boolean(route.contract.request.body.kind === 'body' && route.contract.request.body.schema.rules && ctx.usesZod);
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
