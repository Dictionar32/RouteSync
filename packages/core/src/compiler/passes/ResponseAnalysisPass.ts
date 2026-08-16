/**
 * ResponseAnalysisPass
 *
 * Analyzes the response metadata already present in the route manifest and
 * produces one aggregate ResponseAnalysis artifact containing the per-route
 * ResponseArtifact entries used by downstream consumers.
 *
 * The route manifest is an explicit artifact dependency. CompilationContext is
 * reserved for compilation environment/services and is not used to smuggle
 * semantic compiler inputs into the pass.
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness, type ResolveArtifacts } from './ArtifactKeyWitness';
import type { CompilationContext } from './CompilationContext';
import {
    ResponseArtifactBuilder,
    type ResponseArtifact,
    type ResponseBody,
    type ConfidenceScore,
} from '../ir/ResponseArtifact';
import { ResponseAnalysisArtifact } from '../artifacts/ResponseAnalysisArtifact';
import type { ParsedRoute, ResponseMetadata } from '../../types/route';

export class ResponseAnalysisPass
    implements CompilerPass<readonly ['RouteManifest'], readonly ['ResponseAnalysis']> {
    public readonly name = 'ResponseAnalysis';

    public readonly inputWitnesses = [
        new ArtifactKeyWitness('RouteManifest'),
    ] as const;

    public readonly outputKeys = ['ResponseAnalysis'] as const;

    public readonly descriptor: PassDescriptor = {
        consumes: ['RouteManifest'],
        produces: ['ResponseAnalysis'],
    };

    public readonly requires: readonly PassDependency[] = [
        { artifact: 'RouteManifest' },
    ];

    public readonly producesPass: readonly string[] = [];

    public async run(
        [routeManifestArtifact]: ResolveArtifacts<readonly ['RouteManifest']>,
        context: CompilationContext,
    ): Promise<ResolveArtifacts<readonly ['ResponseAnalysis']>> {
        const responseArtifacts = new Map<string, ResponseArtifact>();

        for (const route of routeManifestArtifact.manifest.routes) {
            try {
                const analysis = this.analyzeRouteResponse(route);
                const artifact = this.buildResponseArtifact(route, analysis);
                responseArtifacts.set(artifact.id, artifact);
            } catch {
                // A single malformed route must not invalidate successfully
                // analyzed routes. Diagnostics belong to the compiler context
                // when a caller needs user-facing error reporting.
            }
        }

        const metadata = {
            hash: this.computeAggregateHash(responseArtifacts),
            producer: this.name,
            dependencies: ['RouteManifest'],
            timestamp: Date.now(),
            revision: '1.0.0',
        } as const;

        return [
            new ResponseAnalysisArtifact(responseArtifacts, metadata),
        ];
    }

    private analyzeRouteResponse(route: ParsedRoute): RouteResponseAnalysis {
        const response = route.response;
        const reasons: string[] = [];
        const responseType = response?.kind ?? 'unknown';
        const collection = response?.collection === true;
        const isPaginated = response?.paginated === true;
        const isCollection = collection || isPaginated;

        reasons.push(`Response kind: ${responseType}`);

        if (collection) {
            reasons.push('Collection detected from response metadata');
        } else if (isPaginated) {
            reasons.push('Paginated response implies collection');
        } else {
            reasons.push('Single response detected');
        }

        const names = this.extractResponseNames(response);

        return {
            routeName: route.name,
            responseType,
            isCollection,
            isPaginated,
            resourceName: names.resourceName,
            modelName: names.modelName,
            confidence: response ? 0.95 : 0.5,
            reasons,
        };
    }

    private extractResponseNames(response: ResponseMetadata | undefined): {
        resourceName?: string;
        modelName?: string;
    } {
        if (!response) {
            return {};
        }

        if (response.kind === 'resource') {
            return { resourceName: response.resource };
        }

        if (response.kind === 'model') {
            return { modelName: response.model };
        }

        return {};
    }

    private buildResponseArtifact(
        route: ParsedRoute,
        analysis: RouteResponseAnalysis,
    ): ResponseArtifact {
        const artifactId = `${route.name}.Response`;
        const responseBody = this.buildResponseBody(analysis);
        const confidence: ConfidenceScore = {
            score: analysis.confidence,
            reasons: analysis.reasons,
            method: 'inferred',
        };

        return new ResponseArtifactBuilder()
            .id(artifactId)
            .body(responseBody)
            .confidence(confidence)
            .metadata({
                producer: this.name,
                dependencies: ['RouteManifest'],
                revision: '1.0.0',
            })
            .build();
    }

    private buildResponseBody(analysis: RouteResponseAnalysis): ResponseBody {
        const shape = analysis.isPaginated
            ? 'paginated'
            : analysis.isCollection
                ? 'collection'
                : 'single';

        switch (analysis.responseType) {
            case 'resource':
                return {
                    type: 'resource',
                    resource: analysis.resourceName ?? 'UnknownResource',
                    model: analysis.modelName,
                    shape,
                };

            case 'model':
                return {
                    type: 'model',
                    model: analysis.modelName ?? 'UnknownModel',
                    shape,
                };

            case 'primitive':
                return {
                    type: 'primitive',
                    primitiveType: this.resolvePrimitiveType(),
                    shape: 'single',
                };

            case 'object':
            case 'unknown':
            default:
                return {
                    type: 'object',
                    schemaName: analysis.routeName,
                    schema: {
                        name: analysis.routeName,
                        properties: {},
                        required: [],
                    },
                    shape,
                };
        }
    }

    private resolvePrimitiveType(): 'string' | 'number' | 'boolean' | 'null' {
        return 'string';
    }

    private computeAggregateHash(
        artifacts: ReadonlyMap<string, ResponseArtifact>,
    ): string {
        let hash = 0;
        const content = Array.from(artifacts.values())
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((artifact) => `${artifact.id}:${artifact.metadata.hash}`)
            .join('|');

        for (let i = 0; i < content.length; i += 1) {
            hash = ((hash << 5) - hash) + content.charCodeAt(i);
            hash |= 0;
        }

        return Math.abs(hash).toString(16);
    }
}

interface RouteResponseAnalysis {
    readonly routeName: string;
    readonly responseType:
    | 'resource'
    | 'model'
    | 'object'
    | 'primitive'
    | 'unknown';
    readonly isCollection: boolean;
    readonly isPaginated: boolean;
    readonly resourceName?: string;
    readonly modelName?: string;
    readonly confidence: number;
    readonly reasons: readonly string[];
}