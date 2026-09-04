/**
 * ResponseAnalysisHelper.ts
 * 
 * CLI integration helper for response analysis SSOT.
 * 
 * This helper converts RouteManifest to ResponseArtifactMap,
 * providing the bridge between CLI layer (RouteManifest) and 
 * compiler layer (ResponseArtifact).
 * 
 * USAGE in CLI generators:
 * ```typescript
 * const manifest = await scanLaravelRoutes(...);
 * const responseMap = ResponseAnalysisHelper.buildResponseArtifactMap(manifest);
 * // Pass responseMap to PassManager as external input
 * ```
 * 
 * KEY PRINCIPLE:
 * This is the ONLY place where collection detection logic should live
 * (besides ResponseAnalysisPass). All generators read from ResponseArtifact.
 */

import type { RouteManifest, GeneratedRoute } from '../../../core/src/types/route';
import {
    ResponseArtifact,
    ResponseArtifactBuilder,
    type ConfidenceScore
} from '../../../core/src/compiler/ir/ResponseArtifact';

/**
 * Build ResponseArtifactMap from RouteManifest
 * 
 * This is the SSOT for collection detection.
 * Analysis results are stored in ResponseArtifact instances.
 * 
 * All downstream generators (ZodTierGenerator, SDKEmitter, HookGenerator)
 * should read from this map instead of re-computing.
 * 
 * @deprecated Use `CompilerBridge.emitFullBundle` or PassManager pipeline instead.
 * @internal Kept for backwards-compatibility with legacy standalone callers.
 */
export class ResponseAnalysisHelper {
    static buildResponseArtifactMap(manifest: RouteManifest): Map<string, ResponseArtifact> {
        const artifacts = new Map<string, ResponseArtifact>();

        console.log(`📊 ResponseAnalysisHelper: Building artifacts for ${manifest.routes.length} routes`);

        for (const route of manifest.routes) {
            try {
                const artifact = this.createResponseArtifact(route);
                artifacts.set(artifact.id, artifact);
            } catch (error) {
                console.warn(`⚠️  Failed to create artifact for ${route.name}: ${error}`);
            }
        }

        console.log(`✅ ResponseAnalysisHelper: Created ${artifacts.size} ResponseArtifacts`);
        return artifacts;
    }

    /**
     * Create ResponseArtifact for a single route
     * 
     * CRITICAL: This is where collection detection happens.
     * No other place should do this analysis.
     */
    private static createResponseArtifact(route: GeneratedRoute): ResponseArtifact {
        const artifactId = `${route.name}.Response`;
        const builder = new ResponseArtifactBuilder().id(artifactId);

        // Determine response characteristics directly from explicit ResponseDescriptor SSOT
        const responseShape = route.response?.shape;
        const isPaginated = responseShape === 'paginated';
        const isCollection = isPaginated || responseShape === 'collection';
        const responseKind = route.response?.kind || 'unknown';

        // Collect analysis reasons
        const reasons: string[] = [];
        let confidence = 0.85;

        if (isPaginated) {
            reasons.push('Paginated response implies collection');
            confidence = 0.95;
        } else if (isCollection) {
            reasons.push('Collection detected from explicit shape');
            confidence = 0.95;
        } else {
            reasons.push('Single response detected');
            confidence = 0.85;
        }

        // Set transport type
        if (responseKind === 'resource' || responseKind === 'model') {
            builder.transport(responseKind);
        } else {
            builder.transport('json');
        }

        // Build response body from explicit SSOT
        const resourceName = (route.response as any)?.resourceName || (route.response as any)?.resource || (route.response as any)?.modelName;
        const modelName = (route.response as any)?.modelName || (route.response as any)?.model;

        let shapeName: 'paginated' | 'collection' | 'single' = 'single';
        if (isPaginated) {
            shapeName = 'paginated';
        } else if (isCollection) {
            shapeName = 'collection';
        }

        if ((responseKind === 'resource' || (responseKind === 'array' && elementKind === 'resource')) && resourceName) {
            builder.resource(
                resourceName,
                modelName,
                shapeName,
                confidence,
                reasons.join('; ')
            );
        } else if ((responseKind === 'model' || (responseKind === 'array' && elementKind === 'model')) && modelName) {
            builder.model(
                modelName,
                shapeName,
                confidence,
                reasons.join('; ')
            );
        } else {
            // Fallback to JSON object
            builder.object(
                route.name,
                { name: route.name, properties: {}, required: [] },
                shapeName,
                Math.max(confidence - 0.1, 0.5),
                `Fallback analysis: ${reasons.join('; ')}`
            );
        }

        // Set HTTP metadata
        builder.status(200);
        builder.contentType('application/json');

        // Set confidence
        const confidenceScore: ConfidenceScore = {
            score: confidence,
            reasons,
            method: 'inferred'
        };
        builder.confidence(confidenceScore);

        return builder.build();
    }
}
