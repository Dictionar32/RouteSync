import { pathToFileURL } from 'node:url';
import { isAbsolute, resolve } from 'node:path';
import {
  REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS,
  requestTypeDerivationContract,
} from '@routesync/core/upstream';
import type { RequestTypeDerivationSemanticPipelineCompositionInterface } from '@routesync/core/upstream';

/** The external host owns semantic production; the CLI only loads its composition. */
export const ROUTESYNC_UPSTREAM_COMPOSITION_MODULE = 'ROUTESYNC_UPSTREAM_COMPOSITION_MODULE';
export const ROUTESYNC_UPSTREAM_COMPOSITION_EXPORT = 'requestTypeDerivationSemanticComposition';

const isObject = (value: unknown): value is object =>
  typeof value === 'object' && value !== null;

/** Compare contract values across independently bundled package entrypoints.
 * Object identity is still required inside one composition, but it cannot be
 * required between the CLI bundle and `routesync/upstream`: those are separate
 * module graphs and therefore may contain separate instances of the same value.
 */
const structurallyEqual = (
  left: unknown,
  right: unknown,
  compared: WeakMap<object, WeakSet<object>> = new WeakMap(),
): boolean => {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    const seen = compared.get(left) ?? new WeakSet<object>();
    if (seen.has(right)) return true;
    seen.add(right);
    compared.set(left, seen);
    return left.every((value, index) => structurallyEqual(value, right[index], compared));
  }
  if (!isObject(left) || !isObject(right)) return false;
  const seen = compared.get(left) ?? new WeakSet<object>();
  if (seen.has(right)) return true;
  seen.add(right);
  compared.set(left, seen);
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) => key === rightKeys[index]
      && structurallyEqual(member(left, key), member(right, key), compared));
};

const member = (value: object, key: string): unknown => Reflect.get(value, key);

/**
 * Accept filesystem paths and package export specifiers. Package specifiers are
 * important for runtime wiring: the exported interface-typed composition can be
 * loaded from the package's public upstream entrypoint without an examples-only
 * re-export shim.
 */
const resolveCompositionModuleSpecifier = (modulePath: string): string => {
  const isFilesystemPath = isAbsolute(modulePath)
    || modulePath.startsWith('./')
    || modulePath.startsWith('../')
    || /^[A-Za-z]:[\\/]/.test(modulePath);
  return isFilesystemPath ? pathToFileURL(resolve(process.cwd(), modulePath)).href : modulePath;
};

const isCapability = (value: unknown, contract: object, operation: string): boolean =>
  isObject(value)
  && member(value, 'contract') === contract
  && typeof member(value, operation) === 'function';

/**
 * Runtime validation must prove the closed authority rule inventory is present;
 * checking only that `decisionRules` is an object would let an incomplete host
 * bundle pass the loader's type guard and fail much later in projection.
 */
const hasCompleteDecisionRuleCoverage = (value: unknown): boolean =>
  isObject(value)
  && REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS.every(ruleId => member(value, ruleId) === 'required');

/**
 * Runtime boundary for the required host-owned semantic composition.
 * Missing capability is reported at the composition boundary instead of
 * silently substituting an in-repository diagnostic implementation.
 */
export interface RouteSyncStandaloneCompositionGuardInterface {
  readonly isComposition: (
    value: unknown,
  ) => value is RequestTypeDerivationSemanticPipelineCompositionInterface;
}

export const routeSyncStandaloneCompositionGuard: RouteSyncStandaloneCompositionGuardInterface = Object.freeze({
  isComposition: (
    value: unknown,
  ): value is RequestTypeDerivationSemanticPipelineCompositionInterface => {
  if (!isObject(value)) return false;
  const contract = member(value, 'contract');
  // A built public package export may contain its own module instance. Require
  // exact canonical contract content, then require all capabilities to bind to
  // that same composition-local contract object. Do not compare cross-bundle
  // object identity, which rejects valid package exports after bundling.
  if (!isObject(contract) || !structurallyEqual(contract, requestTypeDerivationContract)) return false;
  if (member(contract, 'kind') !== 'request_type_derivation_contract') return false;
  if (member(contract, 'authority') !== 'upstream') return false;
  if (member(contract, 'closed') !== true) return false;
  if (!isObject(member(contract, 'policy')) || !isObject(member(contract, 'laws'))) return false;
  const preparation = member(value, 'preparation');
  const authority = member(value, 'authority');
  const integrity = member(value, 'integrity');
  // Preparation is mandatory in the canonical composition interface and runs
  // before reasoning. Validate its executable operation at the same boundary;
  // otherwise a malformed host can pass loading and fail only during inference.
  return isObject(preparation)
    && typeof member(preparation, 'prepare') === 'function'
    && isCapability(member(value, 'reasoning'), contract, 'infer')
    && isCapability(member(value, 'verifier'), contract, 'verify')
    && isCapability(member(value, 'decision'), contract, 'decide')
    && isCapability(authority, contract, 'evaluate')
    && isObject(authority)
    && hasCompleteDecisionRuleCoverage(member(authority, 'decisionRules'))
    && isCapability(integrity, contract, 'validate')
    && isObject(integrity)
    && isObject(member(integrity, 'contractEquivalence'))
    && typeof member(member(integrity, 'contractEquivalence') as object, 'equivalent') === 'function';
  },
});

export type RouteSyncStandaloneCompositionLoadResult =
  | Readonly<{ readonly kind: 'composition_module_missing'; readonly environmentVariable: typeof ROUTESYNC_UPSTREAM_COMPOSITION_MODULE }>
  | Readonly<{ readonly kind: 'composition_module_invalid'; readonly modulePath: string; readonly reason: 'missing_export' | 'invalid_composition' }>
  | Readonly<{ readonly kind: 'composition_module_import_failed'; readonly modulePath: string; readonly message: string }>
  | Readonly<{ readonly kind: 'composition_module_loaded'; readonly composition: RequestTypeDerivationSemanticPipelineCompositionInterface }>;

/**
 * A domain-level description of where the upstream semantic capability comes
 * from. The runtime loader never accepts an optional raw string: absence and
 * a configured module specifier are distinct, inspectable states.
 */
export type RouteSyncStandaloneCompositionModuleLocation =
  | Readonly<{ readonly kind: 'absolute_filesystem_path'; readonly path: string }>
  | Readonly<{ readonly kind: 'relative_filesystem_path'; readonly path: string }>
  | Readonly<{ readonly kind: 'package_specifier'; readonly packageSpecifier: string }>;

export type RouteSyncStandaloneCompositionModuleSource =
  | Readonly<{
      readonly kind: 'environment_not_configured';
      readonly environmentVariable: typeof ROUTESYNC_UPSTREAM_COMPOSITION_MODULE;
    }>
  | Readonly<{
      readonly kind: 'configured_module';
      readonly location: RouteSyncStandaloneCompositionModuleLocation;
    }>;

export interface RouteSyncStandaloneCompositionModuleSourceFactoryInterface {
  readonly fromEnvironment: (
    environment: NodeJS.ProcessEnv,
  ) => RouteSyncStandaloneCompositionModuleSource;
  readonly fromSpecifier: (
    specifier: string,
  ) => RouteSyncStandaloneCompositionModuleSource;
}

const classifyCompositionModuleLocation = (
  specifier: string,
): RouteSyncStandaloneCompositionModuleLocation => {
  if (isAbsolute(specifier) || /^[A-Za-z]:[\\/]/.test(specifier)) {
    return Object.freeze({ kind: 'absolute_filesystem_path', path: specifier });
  }
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return Object.freeze({ kind: 'relative_filesystem_path', path: specifier });
  }
  return Object.freeze({ kind: 'package_specifier', packageSpecifier: specifier });
};

export const routeSyncStandaloneCompositionModuleSourceFactory:
  RouteSyncStandaloneCompositionModuleSourceFactoryInterface = Object.freeze({
    fromEnvironment: (
      environment: NodeJS.ProcessEnv,
    ): RouteSyncStandaloneCompositionModuleSource => {
      const configured = environment[ROUTESYNC_UPSTREAM_COMPOSITION_MODULE];
      return typeof configured === 'string' && configured.trim().length > 0
        ? Object.freeze({
            kind: 'configured_module',
            location: classifyCompositionModuleLocation(configured),
          })
        : Object.freeze({
            kind: 'environment_not_configured',
            environmentVariable: ROUTESYNC_UPSTREAM_COMPOSITION_MODULE,
          });
    },
    fromSpecifier: (
      specifier: string,
    ): RouteSyncStandaloneCompositionModuleSource => {
      if (specifier.trim().length === 0) {
        return Object.freeze({
          kind: 'environment_not_configured',
          environmentVariable: ROUTESYNC_UPSTREAM_COMPOSITION_MODULE,
        });
      }
      return Object.freeze({
        kind: 'configured_module',
        location: classifyCompositionModuleLocation(specifier),
      });
    },
  });

/**
 * Loads only a domain-validated source descriptor. Absence is a first-class
 * ADT case consumed by the CLI's existing fail-closed error branch.
 */
export interface RouteSyncStandaloneCompositionLoaderInterface {
  readonly load: (
    source: RouteSyncStandaloneCompositionModuleSource,
  ) => Promise<RouteSyncStandaloneCompositionLoadResult>;
}

export const routeSyncStandaloneCompositionLoader: RouteSyncStandaloneCompositionLoaderInterface = Object.freeze({
  load: async (
    source: RouteSyncStandaloneCompositionModuleSource,
  ): Promise<RouteSyncStandaloneCompositionLoadResult> => {
  if (source.kind === 'environment_not_configured') {
    return Object.freeze({
      kind: 'composition_module_missing',
      environmentVariable: source.environmentVariable,
    });
  }

  const modulePath = (() => {
    switch (source.location.kind) {
      case 'absolute_filesystem_path':
      case 'relative_filesystem_path':
        return source.location.path;
      case 'package_specifier':
        return source.location.packageSpecifier;
      default: {
        const exhaustive: never = source.location;
        return exhaustive;
      }
    }
  })();
  const moduleSpecifier = resolveCompositionModuleSpecifier(modulePath);
  let loaded: unknown;
  try {
    loaded = await import(moduleSpecifier);
  } catch (error: unknown) {
    // Keep module-resolution/evaluation failures inside the loader's closed ADT.
    // The CLI can now report a deterministic non-zero failure rather than an
    // uncaught exception or an accidental fallback to diagnostic capabilities.
    return Object.freeze({
      kind: 'composition_module_import_failed',
      modulePath,
      message: error instanceof Error ? error.message : String(error),
    });
  }
  if (!isObject(loaded)) {
    return Object.freeze({ kind: 'composition_module_invalid', modulePath, reason: 'missing_export' });
  }

  const composition = member(loaded, ROUTESYNC_UPSTREAM_COMPOSITION_EXPORT);
  if (composition === undefined) {
    return Object.freeze({ kind: 'composition_module_invalid', modulePath, reason: 'missing_export' });
  }
  // A host module is executable code: getters and proxies can throw while the
  // shape guard reads properties. Treat any such failure as invalid input at
  // this boundary rather than letting validation escape the loader ADT.
  let validComposition = false;
  try {
    validComposition = routeSyncStandaloneCompositionGuard.isComposition(composition);
  } catch {
    validComposition = false;
  }
  if (!validComposition) {
    return Object.freeze({ kind: 'composition_module_invalid', modulePath, reason: 'invalid_composition' });
  }

  return Object.freeze({ kind: 'composition_module_loaded', composition });
  },
});
