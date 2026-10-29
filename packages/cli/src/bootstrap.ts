import {
  ROUTESYNC_UPSTREAM_COMPOSITION_MODULE,
  routeSyncStandaloneCompositionLoader,
  routeSyncStandaloneCompositionModuleSourceFactory,
} from './standaloneCompositionLoader';

export interface RouteSyncCliBootstrapInterface {
  readonly run: () => Promise<void>;
}

/**
 * Keep the fail-closed composition check ahead of the optional scanner graph.
 *
 * The scanner and generator modules are loaded only after a host composition
 * has been accepted. This prevents an unused legacy module from executing at
 * process startup and keeps the CLI boundary owned by the upstream contract.
 */
export const routeSyncCliBootstrap: RouteSyncCliBootstrapInterface = Object.freeze({
  run: async (): Promise<void> => {
    const loaded = await routeSyncStandaloneCompositionLoader.load(
      routeSyncStandaloneCompositionModuleSourceFactory.fromEnvironment(process.env),
    );

    switch (loaded.kind) {
      case 'composition_module_missing':
        console.error(`RouteSync CLI is fail-closed: set ${loaded.environmentVariable} to an absolute or working-directory-relative JavaScript module exporting requestTypeDerivationSemanticComposition. See examples/upstream-composition for the interface-first host template.`);
        process.exitCode = 1;
        return;
      case 'composition_module_invalid':
        console.error(`RouteSync CLI composition module is invalid (${loaded.reason}): ${loaded.modulePath}`);
        process.exitCode = 1;
        return;
      case 'composition_module_import_failed':
        console.error(`RouteSync CLI could not import composition module ${loaded.modulePath}: ${loaded.message}`);
        process.exitCode = 1;
        return;
      case 'composition_module_loaded':
        await import('./index');
        return;
      default: {
        const exhaustive: never = loaded;
        exhaustive;
      }
    }
  },
});

const isCliEntry = Boolean(
  process.argv[1]
  && (process.argv[1].endsWith('/cli.js')
    || process.argv[1].endsWith('/cli.cjs')
    || process.argv[1].endsWith('/routesync')
    || process.argv[1].endsWith('/cli')),
);

if (isCliEntry) {
  void routeSyncCliBootstrap.run();
}

export { ROUTESYNC_UPSTREAM_COMPOSITION_MODULE };
