/**
 * @file TypeScriptEmitter.ts
 * @description TypeScript code generator implementing ContractEmitter interface
 */

import type { BackendCapability } from './BackendCapability';
import type { GeneratedArtifact } from './GeneratedArtifact';
import type { ContractEmitter } from './ContractEmitter';
import type {
    ContractGraph,
    ContractVisitor,
    EntityNode,
    SchemaNode,
    RelationNode
} from '../ir/ContractGraph';

/**
 * TypeScript code emitter implementing visitor pattern untuk ContractGraph
 * 
 * Generates TypeScript code dari contract graph nodes menggunakan visitor pattern.
 * Supports full TypeScript features: generics, nullable types, readonly properties.
 * 
 * @example
 * ```typescript
 * const emitter = new TypeScriptEmitter();
 * const artifacts = emitter.emit(contractGraph);
 * 
 * artifacts.forEach(artifact => {
 *   console.log(`Generated ${artifact.filePath}`);
 *   fs.writeFileSync(artifact.filePath, artifact.content);
 * });
 * ```
 */
export class TypeScriptEmitter implements ContractEmitter, ContractVisitor<GeneratedArtifact[]> {
    /**
     * TypeScript supports all modern type system features
     */
    public readonly capability: BackendCapability = {
        supportsGenerics: true,
        supportsNullable: true,
        supportsReadonly: true
    };

    /**
     * Generate TypeScript code artifacts dari contract graph
     * 
     * @param graph - Contract graph containing all contract nodes
     * @returns Array of generated TypeScript file artifacts
     */
    public emit(graph: ContractGraph): readonly GeneratedArtifact[] {
        const artifacts: GeneratedArtifact[] = [];

        // Visit each node dalam graph dan collect generated artifacts
        for (const [_, node] of graph.nodes.entries()) {
            artifacts.push(...node.accept(this));
        }

        return artifacts;
    }

    /**
     * Visit entity node dan generate TypeScript interface
     * 
     * @param node - Entity node to process
     * @returns Generated artifacts untuk entity
     */
    public visitEntity(node: EntityNode): GeneratedArtifact[] {
        // TODO: Implement entity code generation
        // Generate TypeScript interface untuk entity
        // Include properties, methods, relationships
        return [];
    }

    /**
     * Visit schema node dan generate TypeScript type definition
     * 
     * @param node - Schema node to process
     * @returns Generated artifacts untuk schema
     */
    public visitSchema(node: SchemaNode): GeneratedArtifact[] {
        // TODO: Implement schema code generation
        // Generate TypeScript type atau interface untuk schema
        return [];
    }

    /**
     * Visit relation node dan generate TypeScript relationship code
     * 
     * @param node - Relation node to process
     * @returns Generated artifacts untuk relation
     */
    public visitRelation(node: RelationNode): GeneratedArtifact[] {
        // TODO: Implement relation code generation
        // Generate TypeScript code untuk relationships (belongs to, has many, etc)
        return [];
    }
}
