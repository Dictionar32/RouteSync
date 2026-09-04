/**
 * manifest-to-types.ts
 *
 * Master Canonical Facade for RouteSync Manifest Compilation.
 * Pure Declarative Pipeline Facade (100% Backwards Compatible).
 *
 * @module cli/generators/utils
 */

import type { RouteManifest, ParsedRoute } from '../../../../core/src/types/route';
import type { SemanticTypesArtifact } from '../../../../core/src/compiler/artifacts/SemanticTypesArtifact';
import type { RequestTypesArtifact } from '../../../../core/src/compiler/artifacts/RequestTypesArtifact';

import { SemanticTypesPipeline } from './SemanticTypesPipeline';
import { RequestTypesPipeline } from './RequestTypesPipeline';
import { ContractInputPipeline } from './ContractInputPipeline';

import { ScannedRouteManifestDescriptor } from '../../../../core/src/compiler/scanner/StaticLaravelScanner';

function ensureManifest(manifest: RouteManifest): RouteManifest {
    if (manifest.requestTypes && manifest.semanticTypes) {
        return manifest;
    }
    return ScannedRouteManifestDescriptor.create(manifest as any);
}

/**
 * 1. Generates SemanticTypesArtifact for TypeScript pass (api-read.ts).
 */
export function manifestToSemanticTypes(manifest: RouteManifest): SemanticTypesArtifact {
    return SemanticTypesPipeline.execute(ensureManifest(manifest));
}

/**
 * 2. Generates RequestTypesArtifact for Form generation (FormGeneratorPass).
 */
export function manifestToRequestTypes(manifest: RouteManifest): RequestTypesArtifact {
    return RequestTypesPipeline.execute(ensureManifest(manifest));
}

/**
 * 3. Generates RequestTypesArtifact for Contract generation (ContractGeneratorPass).
 */
export function manifestToContractInput(manifest: RouteManifest): RequestTypesArtifact {
    return ContractInputPipeline.execute(ensureManifest(manifest));
}

/**
 * 4. Helper Facade for legacy tests.
 */
export function generateInlineResourceName(route: ParsedRoute): string {
    return route.responseTypeName;
}