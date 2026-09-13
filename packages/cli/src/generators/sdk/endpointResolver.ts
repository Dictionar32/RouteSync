/**
 * endpointResolver.ts
 *
 * Resolves response and contract information for SDK endpoints.
 *
 * @module cli/generators/sdk
 */

import type { EndpointContract } from '@routesync/core';

export interface EndpointResponseInfo {
  readonly type: string;
  readonly schema: string;
  readonly mapper: string | null;
}

export function resolveEndpointResponseInfo(
  contract: EndpointContract,
  usesZod: boolean,
  usedMappers: Set<string>
): EndpointResponseInfo {
  const success = contract.response.success;
  const schemaStr = (usesZod && success.validatorName !== 'undefined') ? success.validatorName : 'undefined';

  const isVoid = success.readTypeName === 'void';
  const isUnknown = success.readTypeName === 'unknown';
  const typeStr = isVoid ? 'void' : isUnknown ? 'unknown' : `Read.${success.readTypeName}`;
  const mapperName = success.mapperName;
  const mapperStr = (!mapperName || mapperName === 'identity') ? null : mapperName;
  if (mapperStr) usedMappers.add(mapperStr);
  return { type: typeStr, schema: schemaStr, mapper: mapperStr };
}
