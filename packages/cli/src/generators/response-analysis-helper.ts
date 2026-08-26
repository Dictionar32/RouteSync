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

        // Determine response characteristics
        const responseKind = route.response?.kind || route.response?.type || 'unknown';
        const arrayElement = responseKind === 'array' ? route.response?.element : undefined;
        const elementKind = arrayElement?.kind;
        const isPaginated = !!(route.response?.paginated || route.response?.resolved?.paginated);
        const isCollectionFromType = responseKind === 'array' || !!(route.response?.collection || route.response?.resolved?.collection);

        // Collect analysis reasons
        const reasons: string[] = [];
        let confidence = 0.75;
        let isCollection = false;

        // KEY DECISION: Determine if collection based on return type, NOT action name
        if (isCollectionFromType) {
            isCollection = true;
            reasons.push('Collection detected from return type');
            confidence = 0.95;
        } else if (isPaginated) {
            isCollection = true;
            reasons.push('Paginated response implies collection');
            confidence = 0.95;
        } else {
            isCollection = false;
            reasons.push('Single response detected');
            confidence = 0.85;
        }

        // Set transport type
        if (responseKind === 'resource' || responseKind === 'model') {
            builder.transport(responseKind);
        } else if (responseKind === 'array' && (elementKind === 'resource' || elementKind === 'model')) {
            builder.transport(elementKind);
        } else {
            builder.transport('json');
        }

        // Build response body
        const resourceName = route.response?.resource || route.response?.model || arrayElement?.resource || arrayElement?.model;
        const modelName = route.response?.model || arrayElement?.model;

        if ((responseKind === 'resource' || (responseKind === 'array' && elementKind === 'resource')) && resourceName) {
            builder.resource(
                resourceName,
                modelName,
                isPaginated ? 'paginated' : isCollection ? 'collection' : 'single',
                confidence,
                reasons.join('; ')
            );
        } else if ((responseKind === 'model' || (responseKind === 'array' && elementKind === 'model')) && modelName) {
            builder.model(
                modelName,
                isPaginated ? 'paginated' : isCollection ? 'collection' : 'single',
                confidence,
                reasons.join('; ')
            );
        } else {
            // Fallback to JSON object
            builder.object(
                route.name,
                { name: route.name, properties: {}, required: [] },
                isPaginated ? 'paginated' : isCollection ? 'collection' : 'single',
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
