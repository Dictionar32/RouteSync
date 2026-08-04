/**
 * @file TypeScriptGenerator.ts
 * @description Transform ContractGraph IR to TypeScript Target AST
 * 
 * Phase 3 - Day 1: Core Generator Implementation
 * 
 * Generator Phase (Otak/Brain):
 * - Input: ContractGraph (IR layer)
 * - Output: TSFile (Target AST)
 * - No string generation (that's Emitter's job)
 * - No formatting (that's Formatter's job)
 * 
 * Responsibilities:
 * - Transform SemanticType to TSTypeReference
 * - Generate TSInterfaceDeclaration from EntityNode
 * - Collect import requirements
 * - Build complete TSFile with imports and declarations
 */

import type { ContractGraph, EntityNode } from '../../ir/ContractGraph';
import type { SemanticType } from '../../types/SemanticType';
import type { IGenerator } from '../IGenerator';
import { TSFile } from '../../target/typescript/nodes/TSFile';
import { TSImportDeclaration } from '../../target/typescript/nodes/TSImportDeclaration';
import { TSInterfaceDeclaration } from '../../target/typescript/nodes/TSInterfaceDeclaration';
import { TSPropertySignature } from '../../target/typescript/nodes/TSPropertySignature';
import { TSTypeReference } from '../../target/typescript/nodes/TSTypeReference';
import { TSComment } from '../../target/typescript/nodes/TSComment';
import { TSArrayType } from '../../target/typescript/nodes/TSArrayType';
import { TSUnionType } from '../../target/typescript/nodes/TSUnionType';
import { ImportCollector, type ImportSpec } from './ImportCollector';

/**
 * Property definition extracted dari EntityNode
 * Helper interface untuk transform properties
 */
interface PropertyDefinition {
    readonly name: string;
    readonly type: SemanticType;
    readonly optional: boolean;
    readonly readonly: boolean;
    readonly description?: string;
}

/**
 * TypeScript Generator - Transform IR to Target AST
 * 
 * Implements compiler-grade transformation dari domain concepts (EntityNode)
 * ke TypeScript AST nodes. Zero `any` types policy.
 * 
 * Phase 3 - Day 1 Implementation:
 * - ImportCollector for tracking imports
 * - semanticTypeToTSType() for type conversion
 * - generateEntityInterface() for interface generation
 */
export class TypeScriptGenerator implements IGenerator<ContractGraph, TSFile> {
    /**
     * Import collector untuk tracking external type references
     */
    private importCollector: ImportCollector;

    /**
     * Track generated interface names to prevent duplicates
     */
    private generatedTypes: Set<string>;

    constructor() {
        this.importCollector = new ImportCollector();
        this.generatedTypes = new Set<string>();
    }

    /**
     * Reset generator state untuk reuse
     * Call this before generating new file
     */
    public reset(): void {
        this.importCollector.clear();
        this.generatedTypes.clear();
    }
    /**
     * Generate TypeScript Target AST dari ContractGraph IR
     * 
     * Main entry point - orchestrates transformation process
     * 
     * Process:
     * 1. Reset state
     * 2. Transform entities to interfaces
     * 3. Collect imports
     * 4. Build TSFile dengan imports dan declarations
     */
    public generate(graph: ContractGraph): TSFile {
        // Reset state untuk clean generation
        this.reset();

        const declarations: TSInterfaceDeclaration[] = [];

        // Process each entity node in graph
        for (const [, node] of graph.nodes.entries()) {
            if (node.kind === 'entity') {
                // Transform entity to interface declaration
                const interfaceDecl = this.transformEntityToInterface(node);
                declarations.push(interfaceDecl);
                this.generatedTypes.add(node.name);
            }
        }

        // Build import declarations dari collected requirements
        const imports = this.buildImportDeclarations();

        return new TSFile(imports, declarations);
    }

    /**
     * Transform EntityNode to TSInterfaceDeclaration
     * 
     * @param entity - Entity node from IR
     * @returns TypeScript interface declaration
     */
    private transformEntityToInterface(
        entity: EntityNode
    ): TSInterfaceDeclaration {
        // Extract properties from EntityNode
        const properties = this.extractProperties(entity);

        // Transform each property to TSPropertySignature
        const propertySignatures = properties.map(prop =>
            this.transformPropertyToSignature(prop)
        );

        // Generate JSDoc comment if description exists
        const comment = entity.description
            ? new TSComment(entity.description, 'doc')
            : undefined;

        return new TSInterfaceDeclaration(
            entity.name,
            propertySignatures,
            [], // extends - TODO: Add inheritance support in future
            true, // exported
            comment
        );
    }

    /**
     * Extract properties dari EntityNode.properties (ImmutableMap)
     */
    private extractProperties(entity: EntityNode): PropertyDefinition[] {
        const properties: PropertyDefinition[] = [];

        // Convert ImmutableMap to array
        for (const [name, type] of entity.properties.entries()) {
            properties.push({
                name,
                type,
                optional: false, // TODO: Determine dari type analysis
                readonly: false, // TODO: Add mutability tracking
                description: undefined // TODO: Add property descriptions
            });
        }

        return properties;
    }

    /**
     * Transform PropertyDefinition to TSPropertySignature
     * 
     * @param prop - Property definition
     * @returns TypeScript property signature
     */
    private transformPropertyToSignature(
        prop: PropertyDefinition
    ): TSPropertySignature {
        // Map semantic type to TS type
        const tsType = this.semanticTypeToTSType(prop.type);

        // Generate property comment if exists
        const comment = prop.description
            ? new TSComment(prop.description, 'line')
            : undefined;

        return new TSPropertySignature(
            prop.name,
            tsType,
            prop.optional,
            prop.readonly,
            comment
        );
    }

    /**
     * Map SemanticType to TSTypeReference (PRIMARY CONVERSION METHOD)
     * 
     * Phase 3 - Day 2: Implementation
     * 
     * Handles all SemanticType variants:
     * - PrimitiveType → TS primitives (string, number, etc.)
     * - ReferenceType → Custom types (User, Product, etc.)
     * - CollectionType → Arrays
     * - UnionType → Union types
     * - IntersectionType → Intersection types
     * - GenericType → Generic types
     * - ObjectType → Inline object types
     * 
     * @param semanticType - Semantic type dari IR
     * @returns TypeScript type reference
     */
    public semanticTypeToTSType(
        semanticType: SemanticType
    ): TSTypeReference {
        switch (semanticType.kind) {
            case 'primitive':
                return this.convertPrimitiveType(semanticType);

            case 'reference':
                return this.convertReferenceType(semanticType);

            case 'readonly_collection':
            case 'mutable_collection':
                return this.convertCollectionType(semanticType);

            case 'union':
                return this.convertUnionType(semanticType);

            case 'intersection':
                return this.convertIntersectionType(semanticType);

            case 'never':
                return new TSTypeReference('never');

            case 'error':
                // Fallback to unknown untuk error types
                return new TSTypeReference('unknown');

            case 'generic':
                return this.convertGenericType(semanticType);

            case 'object':
                return this.convertObjectType(semanticType);
        }
    }

    /**
     * Convert PrimitiveType to TS primitive
     * 
     * Maps RouteSync semantic primitives to TypeScript types:
     * - string → string
     * - number → number
     * - boolean → boolean
     * - datetime → string (ISO 8601 serialization)
     * - unknown → unknown
     */
    private convertPrimitiveType(type: SemanticType): TSTypeReference {
        if (type.kind !== 'primitive') {
            throw new Error('Expected primitive type');
        }

        // Map PrimitiveKind to TypeScript type names
        const typeMap: Record<string, string> = {
            'string': 'string',
            'number': 'number',
            'boolean': 'boolean',
            'datetime': 'string', // DateTime serialized as ISO string
            'unknown': 'unknown'
        };

        const tsTypeName = typeMap[type.type] || 'unknown';
        return new TSTypeReference(tsTypeName);
    }

    /**
     * Convert ReferenceType to TS type reference
     * 
     * Tracks import requirement untuk external types.
     * Co-located file convention: `./TypeName`
     */
    private convertReferenceType(
        type: SemanticType
    ): TSTypeReference {
        if (type.kind !== 'reference') {
            throw new Error('Expected reference type');
        }

        // Collect import requirement
        this.collectImportRequirement(type.name);

        return new TSTypeReference(type.name);
    }

    /**
     * Convert CollectionType to TS array type
     * 
     * Handles both readonly and mutable collections:
     * - readonly_collection → ReadonlyArray<T> or readonly T[]
     * - mutable_collection → Array<T> or T[]
     */
    private convertCollectionType(
        type: SemanticType
    ): TSTypeReference {
        if (type.kind !== 'readonly_collection' && type.kind !== 'mutable_collection') {
            throw new Error('Expected collection type');
        }

        // Convert element type recursively
        const elementType = this.semanticTypeToTSType(type.elementType);

        // Create array type
        // TODO: Implement proper readonly array distinction
        return elementType.toArray();
    }

    /**
     * Convert UnionType to TS union
     * 
     * Phase 3 - Day 3: Full implementation needed
     * Current: Returns first member as fallback
     */
    private convertUnionType(
        type: SemanticType
    ): TSTypeReference {
        if (type.kind !== 'union') {
            throw new Error('Expected union type');
        }

        // For now, just map first member
        // TODO: Create TSUnionType node and map all members
        const firstMember = Array.from(type.members.values())[0];
        if (firstMember) {
            return this.semanticTypeToTSType(firstMember);
        }

        return new TSTypeReference('unknown');
    }

    /**
     * Convert IntersectionType to TS intersection
     * 
     * Phase 3 - Day 3: Full implementation needed
     * Current: Returns first member as fallback
     */
    private convertIntersectionType(
        type: SemanticType
    ): TSTypeReference {
        if (type.kind !== 'intersection') {
            throw new Error('Expected intersection type');
        }

        // For now, just map first member
        // TODO: Create TSIntersectionType node and map all members
        const firstMember = Array.from(type.members.values())[0];
        if (firstMember) {
            return this.semanticTypeToTSType(firstMember);
        }

        return new TSTypeReference('unknown');
    }

    /**
     * Convert GenericType to TS generic
     * 
     * Phase 3 - Day 3: Full implementation needed
     * Current: Returns base type without parameters
     */
    private convertGenericType(
        type: SemanticType
    ): TSTypeReference {
        if (type.kind !== 'generic') {
            throw new Error('Expected generic type');
        }

        // For now, just map base type
        // TODO: Map generic parameters properly
        return this.convertReferenceType(type.base);
    }

    /**
     * Convert ObjectType to TS type
     * 
     * Phase 3 - Day 3: Full implementation needed
     * Current: Returns generic 'object' type
     */
    private convertObjectType(
        type: SemanticType
    ): TSTypeReference {
        if (type.kind !== 'object') {
            throw new Error('Expected object type');
        }

        // For now, just return generic object
        // TODO: Create inline object type or type alias
        return new TSTypeReference('object');
    }

    /**
     * Collect import requirement untuk custom types
     * 
     * Tracks type references that need imports.
     * Skips primitive types and types generated in same file.
     * 
     * Convention: Co-located types use `./${TypeName}` import path
     */
    private collectImportRequirement(typeName: string): void {
        // Skip primitives
        const primitives = new Set([
            'string', 'number', 'boolean', 'null', 'undefined',
            'unknown', 'never', 'object', 'any', 'void'
        ]);
        if (primitives.has(typeName)) {
            return;
        }

        // Skip if already generated in this file
        if (this.generatedTypes.has(typeName)) {
            return;
        }

        // Skip if already collected
        if (this.importCollector.has(typeName, `./${typeName}`)) {
            return;
        }

        // Add type import (convention: co-located files)
        this.importCollector.addNamedImport(
            typeName,
            `./${typeName}`,
            true // type-only import
        );
    }

    /**
     * Build TSImportDeclaration[] dari collected requirements
     * 
     * Returns sorted array of type-only imports.
     * ImportCollector handles deduplication and sorting.
     */
    private buildImportDeclarations(): TSImportDeclaration[] {
        const imports: TSImportDeclaration[] = [];
        const specs = this.importCollector.getImports();

        for (const spec of specs) {
            // Convert ImportSpec to TSImportDeclaration
            const importDecl = this.convertImportSpecToDeclaration(spec);
            imports.push(importDecl);
        }

        return imports;
    }

    /**
     * Convert ImportSpec to TSImportDeclaration
     * 
     * Handles named imports, default imports, and namespace imports
     */
    private convertImportSpecToDeclaration(spec: ImportSpec): TSImportDeclaration {
        const namedImports = Array.from(spec.named);

        if (spec.isTypeOnly) {
            // Type-only import
            return TSImportDeclaration.typeImport(namedImports, spec.source);
        } else {
            // Value import
            return TSImportDeclaration.valueImport(namedImports, spec.source);
        }
    }
}
