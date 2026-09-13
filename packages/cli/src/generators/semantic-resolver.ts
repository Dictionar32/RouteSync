/**
 * @file semantic-resolver.ts
 * @description Active Consumer Orchestrator: transforms RouteManifest into resolved CompilerIR
 *
 * Consumes focused sub-domains from ./semantic/ with pure dataflow declaration.
 * 0 inline parsing, 0 defensive fallback, 0 wildcard re-exports.
 *
 * @module cli/generators/semantic-resolver
 */

import type { RouteManifest } from '@routesync/core';
import { CANONICAL_ACTION_MAP } from './canonical-names';

// Re-exported Sub-domain Types (Explicit named exports - 0 'export * from')
export type {
    CompilerIR,
    ResolvedResponse,
    ResolvedField,
    ResolvedRoute,
    NormalizedColumnInfo,
    NormalizedModelInfo,
    FieldResolutionMeta,
} from './semantic/semanticTypes';
export { toFieldResolutionMeta } from './semantic/semanticTypes';

// Re-exported Sub-domain Extractors & Context
export {
    resolveCanonicalAction,
    extractThisPropertyAccess,
    isNullableTernaryGuard,
    SemanticResolutionContext
} from './semantic/SemanticResolutionContext';

import type { CompilerIR } from './semantic/semanticTypes';
import { SemanticResolutionContext } from './semantic/SemanticResolutionContext';
import { ResponseResolver } from './semantic/ResponseResolver';
import { ResourceFieldResolver } from './semantic/ResourceFieldResolver';

export class SemanticResolver {
    /**
     * Core entry point: transforms manifest into resolved IR
     * Pure Flow Declaration consuming focused sub-domains
     */
    public static resolve(manifest: RouteManifest): CompilerIR {
        const startTime = performance.now();
        const context = SemanticResolutionContext.fromManifest(manifest);
        const ir = this.createInitialIR(context);

        try {
            // Phase 1: Resolve all response types (ResponseResolver)
            ResponseResolver.resolveResponseTypes(context, ir);

            // Phase 2: Resolve all field mappings (ResourceFieldResolver)
            ResourceFieldResolver.resolveFieldMappings(context, ir);

            // Phase 3: Resolve routes (ResponseResolver)
            ResponseResolver.resolveRoutes(context, ir);

            // Phase 4: Count responses per group (ResponseResolver)
            ResponseResolver.countResponsesByGroup(context, ir);

            // Validation
            this.validateIR(ir);

            const elapsed = performance.now() - startTime;
            console.log(`[SemanticResolver] Resolved manifest in ${elapsed.toFixed(2)}ms`);
        } catch (error) {
            ir.metadata.errors.push(`Failed to resolve manifest: ${error}`);
            throw error;
        }

        return ir;
    }

    private static createInitialIR(context: SemanticResolutionContext): CompilerIR {
        return {
            responseTypes: new Map(),
            actionMappings: { ...CANONICAL_ACTION_MAP },
            fieldMappings: new Map(),
            resourceAliases: new Map(),
            responseCountByGroup: new Map(),
            resolvedRoutes: [],
            metadata: {
                computedAt: new Date(),
                manifestHash: this.hashManifest(context),
                totalRoutes: context.routes.length,
                totalModels: context.models.length,
                totalResources: context.resources.length,
                errors: [],
                warnings: [],
            },
        };
    }

    private static hashManifest(context: SemanticResolutionContext): string {
        return JSON.stringify({
            routes: context.routes.length,
            models: context.models.length,
            resources: context.resources.length,
        });
    }

    private static validateIR(ir: CompilerIR): void {
        if (ir.responseTypes.size === 0) {
            ir.metadata.warnings.push('No response types resolved from manifest');
        }

        if (ir.resolvedRoutes.length === 0) {
            ir.metadata.warnings.push('No routes resolved from manifest');
        }

        const usedResponseIds = new Set(ir.resolvedRoutes.map(r => r.responseId));
        for (const responseId of ir.responseTypes.keys()) {
            if (!usedResponseIds.has(responseId)) {
                ir.metadata.warnings.push(`Orphaned response type: ${responseId}`);
            }
        }
    }
}
