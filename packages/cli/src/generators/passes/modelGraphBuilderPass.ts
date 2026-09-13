/**
 * Model Graph Builder Pass.
 * Builds service model graph from RouteManifest models.
 *
 * @module cli/generators/passes
 */

import {
    RouteManifest,
    SemanticResolutionKernel,
    ServiceGraphBuilder,
    SemanticModelNode,
    DATABASE_COLUMN_KIND_REGISTRY
} from '@routesync/core';
import type { CompilerPass, CompilerContext } from '../pipeline';

export class ModelGraphBuilderPass implements CompilerPass<RouteManifest, { manifest: RouteManifest; kernel: SemanticResolutionKernel }> {
    readonly id = "graph-builder";
    readonly name = "ModelGraphBuilder";
    readonly inputKind = "RouteManifest";
    readonly outputKind = "ResolvedManifest";

    constructor(private externalKernel?: SemanticResolutionKernel) {}

    run(manifest: RouteManifest, context: CompilerContext): { manifest: RouteManifest; kernel: SemanticResolutionKernel } {
        const kernel = this.externalKernel || new SemanticResolutionKernel();
        const graphBuilder = new ServiceGraphBuilder();
        
        if (manifest.models) {
            manifest.models.forEach(m => {
                const modelNode = graphBuilder.buildModelNode(m.name);
                const fields: Record<string, unknown> = {};
                m.columns.forEach(col => {
                    let type = 'string';
                    if (col.columnKind && DATABASE_COLUMN_KIND_REGISTRY[col.columnKind]) {
                        type = DATABASE_COLUMN_KIND_REGISTRY[col.columnKind].tsType;
                    } else {
                        const lower = col.type.toLowerCase();
                        if (lower.includes('int') || lower.includes('float') || lower.includes('double') || lower.includes('decimal')) type = 'number';
                        else if (lower.includes('bool') || lower.includes('tinyint(1)')) type = 'boolean';
                    }
                    fields[col.name] = { type, nullable: !!col.nullable };
                });
                
                const semanticModelNode = modelNode as unknown as SemanticModelNode;
                semanticModelNode.fields = fields;
                if (m.relations) {
                    semanticModelNode.relations = m.relations;
                }
                if (m.accessors) {
                    semanticModelNode.accessors = m.accessors;
                }
                if (m.casts) {
                    semanticModelNode.casts = m.casts;
                }
                graphBuilder.registerModel(m.name, modelNode);
            });
        }
        kernel.loadGraph(graphBuilder.getGraph());

        return { manifest, kernel };
    }
}
