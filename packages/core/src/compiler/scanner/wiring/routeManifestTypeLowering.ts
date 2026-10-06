import { RequestTypeDeriver } from '../subscanners/RequestTypeDeriver';
import { SemanticTypeDeriver } from '../subscanners/SemanticTypeDeriver';
import { TypeInterner } from '../../types/TypeInterner';
import { routeFlowsFromManifest, modelAstsFromManifest, resourceAstsFromManifest, requestAstsFromManifest } from './routeManifestProjectionInputs';
import type { RouteSyncManifest } from '../../../types/upstream/manifest';
import type { RouteManifestTypeLowering, RouteManifestTypeLoweringInterface } from './routeManifestTypeLoweringInterface';

/**
 * Explicit downstream type-lowering adapter.
 *
 * Upstream owns the semantic source vocabulary and manifest. Wiring owns the
 * compiler-specific materialization into RequestType/ObjectType. The former facade added no semantic boundary and is therefore retired.
 */
const lower = (manifest: RouteSyncManifest): RouteManifestTypeLowering => {
  const routes = routeFlowsFromManifest(manifest);
  const models = modelAstsFromManifest(manifest);
  const resources = resourceAstsFromManifest(manifest);
  const requests = requestAstsFromManifest(manifest);
  const interner = TypeInterner.create();

  return Object.freeze({
    kind: 'route_manifest_type_lowering',
    requestTypes: RequestTypeDeriver.derive(routes, resources, requests, interner),
    semanticTypes: SemanticTypeDeriver.derive(resources, models, interner, routes),
  });
};

export const routeManifestTypeLowering: RouteManifestTypeLoweringInterface = Object.freeze({ project: lower });
