/**
 * manifest-to-types.ts
 *
 * Master Canonical Facade for RouteSync Manifest Compilation.
 * Pure Declarative Pipeline Facade (100% Backwards Compatible).
 *
 * @module cli/generators/utils
 */

import type { RouteManifest, RouteSemanticFlow, SemanticTypesArtifact, RequestTypesArtifact } from '@routesync/core';

import { SemanticTypesPipeline } from './SemanticTypesPipeline';
import { RequestTypesPipeline } from './RequestTypesPipeline';
import { ContractInputPipeline } from './ContractInputPipeline';


/**
 * 1. Generates SemanticTypesArtifact for TypeScript pass (api-read.ts).
 */
export interface ManifestToSemanticTypesOperation {
  (manifest: RouteManifest): SemanticTypesArtifact;
}

export const manifestToSemanticTypes: ManifestToSemanticTypesOperation = Object.freeze((manifest: RouteManifest): SemanticTypesArtifact => {
    return SemanticTypesPipeline.execute(manifest);
});

/**
 * 2. Generates RequestTypesArtifact for Form generation (FormGeneratorPass).
 */
export interface ManifestToRequestTypesOperation {
  (manifest: RouteManifest): RequestTypesArtifact;
}

export const manifestToRequestTypes: ManifestToRequestTypesOperation = Object.freeze((manifest: RouteManifest): RequestTypesArtifact => {
    return RequestTypesPipeline.execute(manifest);
});

/**
 * 3. Generates RequestTypesArtifact for Contract generation (ContractGeneratorPass).
 */
export interface ManifestToContractInputOperation {
  (manifest: RouteManifest): RequestTypesArtifact;
}

export const manifestToContractInput: ManifestToContractInputOperation = Object.freeze((manifest: RouteManifest): RequestTypesArtifact => {
    return ContractInputPipeline.execute(manifest);
});

/**
 * 4. Helper Facade for legacy tests.
 */
export interface GenerateInlineResourceNameOperation {
  (route: RouteSemanticFlow): string;
}

export const generateInlineResourceName: GenerateInlineResourceNameOperation = Object.freeze((route: RouteSemanticFlow): string => {
    return route.responseTypeName;
});