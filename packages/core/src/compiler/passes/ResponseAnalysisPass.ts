/**
 * ResponseAnalysisPass.ts
 * 
 * SSOT for Response Analysis: Single source of truth for collection detection
 * and response type inference.
 * 
 * PURPOSE:
 * This pass analyzes HTTP response characteristics from parsed routes and
 * creates ResponseArtifact entries. All downstream generators (Zod, SDK, Hooks)
 * read from these artifacts instead of re-computing collection detection.
 * 
 * IMPLEMENTS:
 * - Single Source of Truth (Principle #1)
 * - Unidirectional Dependencies (Parser → Analysis → Artifact → Emitters)
 * - All Communication Via ArtifactRegistry (Principle #9)
 * 
 * INPUT: RouteArtifact (parsed routes from Laravel)
 * OUTPUT: ResponseArtifact (analyzed response characteristics)
 * 
 * ANALYSIS STAGES:
 * 1. Collect route metadata for each endpoint
 * 2. Detect resource type (Resource, Model, Object, Primitive)
 * 3. Detect collection vs single (from return type, NOT action name heuristic)
 * 4. Detect pagination
 * 5. Build confidence scores
 * 6. Create ResponseArtifact entries
 * 
 * KEY PRINCIPLE:
 * Do NOT use action name heuristics (e.g., 'index' means collection).
 * Instead, analyze the ACTUAL return type from semantic analysis.
 * 
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import type { ArtifactKeyWitness, ResolveArtifacts } from './ArtifactKeyWitness';
import type { CompilationContext } from './CompilationContext';
import {
    ResponseArtifact,
    ResponseArtifactBuilder,
    type ResponseBody,
    type ConfidenceScore,
} from '../ir/ResponseArtifact';
import type { RouteManifest, GeneratedRoute } from '../../types/route';

/**
 * Response analysis result for a single route
 */
interface RouteResponseAnalysis {
    routeName: string;
    responseType: 'resource' | 'model' | 'object' | 'primitive' | 'unknown';
    isCollection: boolean;
    isPaginated: boolean;
    resourceName?: string;
    modelName?: string;
    confidence: number;
    reasons: string[];
}

/**
 * ResponseAnalysisPass
 * 
 * Analyzes routes to produce ResponseArtifact entries.
 * This is THE pass that determines collection detection for all generators.
 * 
 * INPUT: RouteManifest (from CLI scanning)
 * OUTPUT: Map<routeId, ResponseArtifact>
 * 
 * The artifact map is stored and made available to all downstream generators
 * via CompilationState.
 */
export class ResponseAnalysisPass implements CompilerPass<['RouteAnalysis'], ['ResponseAnalysis']> {
    readonly name = 'ResponseAnalysis';

    readonly inputWitnesses = {
        0: { key: 'RouteAnalysis' } as ArtifactKeyWitness<'RouteAnalysis'>
    };

    readonly outputKeys = ['ResponseAnalysis'] as const;

    readonly descriptor: PassDescriptor = {
        consumes: ['RouteAnalysis'],
        produces: ['ResponseAnalysis']
    };

    readonly requires: PassDependency[] = [
        { artifact: 'RouteAnalysis' }
    ];

    readonly producesPass: string[] = [];

    /**
     * Execute response analysis pass
     * 
     * @param inputs Tuple with single element: RouteManifest
     * @param context Compilation context
     * @returns Tuple with single element: ResponseArtifactMap
     */
    async run(
        inputs: ResolveArtifacts<['RouteAnalysis']>,
        context: CompilationContext
    ): Promise<ResolveArtifacts<['ResponseAnalysis']>> {
        const [routeManifest] = inputs;

        console.log(`🔍 ResponseAnalysisPass: Analyzing ${routeManifest.routes.length} routes for response characteristics`);

        // Analyze each route's response
        const responseArtifacts = new Map<string, ResponseArtifact>();

        for (const route of routeManifest.routes) {
            try {
                const analysis = this.analyzeRouteResponse(route);
                const artifact = this.buildResponseArtifact(route, analysis);
                responseArtifacts.set(artifact.id, artifact);
            } catch (error) {
                console.warn(`⚠️  Failed to analyze response for ${route.name}: ${error}`);
            }
        }

        console.log(`✅ ResponseAnalysisPass: Created ${responseArtifacts.size} response artifacts`);

        // Return as tuple (single output artifact)
        return [responseArtifacts] as ResolveArtifacts<['ResponseAnalysis']>;
    }

    /**
     * Analyze a single route's response characteristics
     * 
     * KEY DECISION POINT: Determine if response is collection or single.
     * This analysis should NOT depend on action name heuristics.
     */
    private analyzeRouteResponse(route: GeneratedRoute): RouteResponseAnalysis {
        const reasons: string[] = [];

        // 1. Detect response type from semantic analysis
        const responseKind = route.response?.kind || 'unknown';
        const isPaginated = !!(route.response?.paginated || route.response?.resolved?.paginated);
        const collection = !!(route.response?.collection || route.response?.resolved?.collection);

        reasons.push(`Response kind: ${responseKind}`);

        // 2. Determine if collection from actual type information (NOT action name)
        // The semantic analysis should already have this from the actual return type
        let isCollection = collection || false;
        let confidence = 0.8;

        if (collection) {
            reasons.push('Collection detected from return type');
            confidence = 0.95;
        } else if (isPaginated) {
            isCollection = true;
            reasons.push('Paginated response implies collection');
            confidence = 0.95;
        } else {
            // Single response
            reasons.push('Single response detected');
            confidence = 0.85;
        }

        // 3. Extract resource/model name
        const resourceName = route.response?.resource || route.response?.model;
        const modelName = route.response?.model;

        if (resourceName) {
            reasons.push(`Resource: ${resourceName}`);
        }

        return {
            routeName: route.name,
            responseType: responseKind as 'resource' | 'model' | 'object' | 'primitive' | 'unknown',
            isCollection,
            isPaginated,
            resourceName,
            modelName,
            confidence,
            reasons
        };
    }

    /**
     * Build ResponseArtifact from analysis
     */
    private buildResponseArtifact(route: GeneratedRoute, analysis: RouteResponseAnalysis): ResponseArtifact {
        const artifactId = `${route.name}.Response`;

        // Build the response body based on type
        let responseBody: ResponseBody;

        if (analysis.responseType === 'resource') {
            responseBody = {
                type: 'resource',
                resource: analysis.resourceName || 'UnknownResource',
                model: analysis.modelName,
                shape: analysis.isPaginated ? 'paginated' : analysis.isCollection ? 'collection' : 'single',
                properties: undefined // Will be filled by semantic analysis pass
            };
        } else if (analysis.responseType === 'model') {
            responseBody = {
                type: 'model',
                model: analysis.modelName || 'UnknownModel',
                shape: analysis.isPaginated ? 'paginated' : analysis.isCollection ? 'collection' : 'single',
                attributes: undefined
            };
        } else if (analysis.responseType === 'object') {
            responseBody = {
                type: 'object',
                shape: analysis.isPaginated ? 'paginated' : analysis.isCollection ? 'collection' : 'single',
                schema: {
                    name: analysis.routeName,
                    properties: {},
                    required: []
                }
            };
        } else if (analysis.responseType === 'primitive') {
            responseBody = {
                type: 'primitive',
                primitiveType: 'unknown' as any,
                shape: 'single' as const
            };
        } else {
            responseBody = {
                type: 'object',
                shape: 'single' as const,
                schema: {
                    name: 'Unknown',
                    properties: {},
                    required: []
                }
            };
        }

        // Build confidence score
        const confidenceScore: ConfidenceScore = {
            score: analysis.confidence,
            reasons: analysis.reasons,
            method: 'inferred'
        };

        // Create the artifact using builder
        const artifact = new ResponseArtifactBuilder()
            .id(artifactId)
            .body(responseBody)
            .confidence(confidenceScore)
            .build();

        return artifact;
    }
}
