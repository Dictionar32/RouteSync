import type {
  OperationIdentityCapabilityContract,
  OperationIdentityReference,
} from '../../../types/upstream/operationIdentityCapability';
import type { OperationIdentityProjectionInterface } from '../../../types/interfaces/operationIdentityProjectionInterface';

/**
 * Canonical upstream -> wiring -> downstream projection for operation identity.
 *
 * The capability is already closed upstream. This module only serializes the
 * closed identity into the SDK-safe reference shape; it never derives identity.
 */
const project = (
  capability: OperationIdentityCapabilityContract,
): OperationIdentityReference => {
  const route = capability.identity.route;
  return Object.freeze({
    kind: 'operation_identity_reference',
    identity: Object.freeze({
      key: route.key.value.value,
      method: route.method.kind === 'match' ? route.method.methods.join('|') : route.method.kind.toUpperCase(),
      path: route.path.value.value,
    }),
  });
};

export const operationIdentityProjection: OperationIdentityProjectionInterface = Object.freeze({ project });

export function operationIdentityReferenceFromCapability(
  capability: OperationIdentityCapabilityContract,
): OperationIdentityReference {
  return operationIdentityProjection.project(capability);
}
