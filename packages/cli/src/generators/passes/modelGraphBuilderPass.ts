import type { RouteManifest } from '@routesync/core';
import type { CompilerPass, CompilerContext } from '../pipeline';
import { SemanticResolutionKernel } from '@routesync/core';
import { buildModelGraph } from '../normalizer/modelGraphBuilder';

export class ModelGraphBuilderPass implements CompilerPass<RouteManifest, { manifest: RouteManifest; kernel: SemanticResolutionKernel }> {
    readonly id = "graph-builder";
    readonly name = "ModelGraphBuilder";
    readonly inputKind = "RouteManifest";
    readonly outputKind = "ResolvedManifest";

    constructor(private externalKernel?: SemanticResolutionKernel) {}

    run(manifest: RouteManifest, _context: CompilerContext): { manifest: RouteManifest; kernel: SemanticResolutionKernel } {
        const kernel = this.externalKernel ?? new SemanticResolutionKernel();
        buildModelGraph(manifest, kernel);
        return { manifest, kernel };
    }
}
