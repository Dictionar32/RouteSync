/**
 * ResponseAnalysisPass.ts
 *
 * Analyzes route response metadata and produces aggregate ResponseAnalysisArtifact.
 * Pure direct flow coordinator consuming strongly-typed route.response Value Objects.
 *
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness, type ResolveArtifacts } from './ArtifactKeyWitness';
import type { CompilationContext } from './CompilationContext';
import {
    ResponseArtifactBuilder,
    type ResponseArtifact,
    type ConfidenceScore
} from '../ir/ResponseArtifact';
import { ResponseAnalysisArtifact } from '../artifacts/ResponseAnalysisArtifact';
import type { ParsedRoute, ResponseDescriptor, RouteResponseAnalysis } from '../../types/route';

export interface ResponseAnalysisPassDependencies {
    readonly defaultConfidence?: number;
    readonly revision?: string;
}

export function analyzeRouteResponse(
    route: ParsedRoute,
    confidence: number
): RouteResponseAnalysis {
    return route.response.toAnalysis(route.name, confidence);
}

export function buildResponseArtifact(
    routeName: string,
    descriptor: ResponseDescriptor,
    confidenceScore: number,
    producerName: string,
    revision: string
): ResponseArtifact {
    const artifactId = `${routeName}.Response`;
    const responseBody = descriptor.toResponseBody();
    const confidence: ConfidenceScore = {
        score: confidenceScore,
        reasons: [
            `Response kind: ${descriptor.kind}`,
            `Response shape: ${descriptor.shape}`
        ],
        method: 'inferred'
    };

    return new ResponseArtifactBuilder()
        .id(artifactId)
        .body(responseBody)
        .confidence(confidence)
        .metadata({
            producer: producerName,
            dependencies: ['RouteManifest'],
            revision
        })
        .build();
}

export function computeAggregateHash(artifacts: ReadonlyMap<string, ResponseArtifact>): string {
    let acc = 0;
    for (const [id] of artifacts) {
        for (let i = 0; i < id.length; i++) {
            acc = (acc * 31 + id.charCodeAt(i)) >>> 0;
        }
    }
    return `resp_analysis_${acc.toString(16)}`;
}

export class ResponseAnalysisPass
    implements CompilerPass<readonly ['RouteManifest'], readonly ['ResponseAnalysis']> {

    public readonly name = 'ResponseAnalysis';

    public readonly inputWitnesses = [
        new ArtifactKeyWitness('RouteManifest')
    ] as const;

    public readonly outputKeys = ['ResponseAnalysis'] as const;

    public readonly descriptor: PassDescriptor<
        readonly ['RouteManifest'],
        readonly ['ResponseAnalysis']
    > = {
            consumes: ['RouteManifest'],
            produces: ['ResponseAnalysis']
        };

    public readonly requires: readonly PassDependency<'RouteManifest'>[] = [
        { artifact: 'RouteManifest' }
    ];

    public readonly producesPass: readonly string[] = [];

    public readonly defaultConfidence: number;
    public readonly revision: string;

    constructor({
        defaultConfidence = 0.95,
        revision = '1.0.0'
    }: ResponseAnalysisPassDependencies = {}) {
        this.defaultConfidence = defaultConfidence;
        this.revision = revision;
        Object.freeze(this);
    }

    public async run(
        [routeManifestArtifact]: ResolveArtifacts<readonly ['RouteManifest']>,
        _context?: CompilationContext
    ): Promise<ResolveArtifacts<readonly ['ResponseAnalysis']>> {
        const responseArtifacts = new Map<string, ResponseArtifact>();

        for (const route of routeManifestArtifact.manifest.routes) {
            const artifact = buildResponseArtifact(route.name, route.response, this.defaultConfidence, this.name, this.revision);
            responseArtifacts.set(artifact.id, artifact);
        }

        const metadata = {
            hash: computeAggregateHash(responseArtifacts),
            producer: this.name,
            dependencies: ['RouteManifest'],
            timestamp: Date.now(),
            revision: this.revision
        } as const;

        return [
            new ResponseAnalysisArtifact(responseArtifacts, metadata)
        ];
    }
}