import { join } from 'node:path';
import type { LaravelDefaultRouteSourceResolutionInterface } from './laravelRouteSourceSelection';
import { sourceFileIdentityFactory, sourceFileInventoryFactory } from './names';
import { stringValue } from './valueObjects';

/** Laravel's conventional route-file inventory, represented as typed source identities. */
export const laravelDefaultRouteSourceResolution: LaravelDefaultRouteSourceResolutionInterface = Object.freeze({
  kind: 'laravel_default_route_source_resolution',
  resolve: sourceProject => {
    const routeDirectory = join(sourceProject.root.value.value, 'routes');
    return sourceFileInventoryFactory.empty()
      .include(sourceFileIdentityFactory.create(stringValue.create(join(routeDirectory, 'api.php'))))
      .include(sourceFileIdentityFactory.create(stringValue.create(join(routeDirectory, 'web.php'))));
  },
});
