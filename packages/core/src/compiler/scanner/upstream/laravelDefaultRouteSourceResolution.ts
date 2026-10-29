/**
 * Filesystem adapter for Laravel's conventional route-source layout.
 * The upstream selection ADT expresses intent; this adapter owns concrete paths and SourceFile creation.
 */
import path from 'node:path';
import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import { sourceFileInventoryFactory, type SourceFileInventory, sourceFileIdentityFactory, stringValue } from '../../../types/upstream/names';
import type { LaravelDefaultRouteSourceResolutionInterface } from '../../../types/upstream/laravelRouteSourceSelection';

export const laravelDefaultRouteSourceResolution: LaravelDefaultRouteSourceResolutionInterface = Object.freeze({
  kind: 'laravel_default_route_source_resolution',
  resolve: (sourceProject: SourceProjectIdentity): SourceFileInventory => {
    const routeDirectory = path.join(sourceProject.root.value.value, 'routes');
    return sourceFileInventoryFactory.empty()
      .include(sourceFileIdentityFactory.create(stringValue.create(path.join(routeDirectory, 'api.php'))))
      .include(sourceFileIdentityFactory.create(stringValue.create(path.join(routeDirectory, 'web.php'))));
  },
});
