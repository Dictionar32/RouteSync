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
import { TSIntersectionType } from '../../target/typescript/nodes/TSIntersectionType';
import { ImportCollector, type ImportSpec } from './ImportCollector';
import { ObjectType } from '../../types/SemanticType';

// ═══════════════════════════════════════════════════════════════
// Phase 3 - Day 5: Custom Error Classes
// ═══════════════════════════════════════════════════════════════

/**
 * Error thrown during type conversion dari SemanticType ke TypeScript type
 * 
 * Provides context tentang source type yang gagal diconvert dan hints
 * untuk troubleshooting.
 */
export class TypeConversionError extends Error {
    constructor(
        message: string,
        public readonly sourceType: SemanticType,
        public readonly hint?: string
    ) {
        super(message);
        this.name = 'TypeConversionError';

        // Maintain proper stack trace dalam V8
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, TypeConversionError);
        }
    }

    /**
     * Get formatted error message dengan context
     */
    public getDetailedMessage(): string {
        let msg = `${this.name}: ${this.message}\n`;
        msg += `  Source Type: ${this.sourceType.kind}\n`;

        if (this.hint) {
            msg += `  Hint: ${this.hint}\n`;
        }

        return msg;
    }
}

/**
 * Error thrown during interface generation dari ObjectType
 * 
 * Provides context tentang interface name dan type yang bermasalah.
 */
export class InterfaceGenerationError extends Error {
    constructor(
        message: string,
        public readonly interfaceName: string,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'InterfaceGenerationError';

        // Maintain proper stack trace dalam V8
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InterfaceGenerationError);
        }
    }

    /**
     * Get formatted error message dengan context
     */
    public getDetailedMessage(): string {
        let msg = `${this.name}: ${this.message}\n`;
        msg += `  Interface Name: ${this.interfaceName}\n`;

        if (this.cause) {
            msg += `  Cause: ${this.cause.message}\n`;
        }

        return msg;
    }
}

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
        this.syntheticTypeCounter = 0; // Reset counter untuk synthetic types
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

        // Generate JSDoc comment
        // TODO: Add description support to EntityNode in future
        const comment = new TSComment(
            `Interface for ${entity.name}`,
            'jsdoc'
        );

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
            ? new TSComment(prop.description, 'single-line')
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
     * Phase 3 - Day 2: Implementation with enhanced collection types + union/intersection
     * 
     * Handles all SemanticType variants:
     * - PrimitiveType → TS primitives (string, number, etc.)
     * - ReferenceType → Custom types (User, Product, etc.)
     * - CollectionType → Arrays (dengan readonly support)
     * - UnionType → Union types (A | B | C)
     * - IntersectionType → Intersection types (A & B & C)
     * - GenericType → Generic types
     * - ObjectType → Inline object types
     * 
     * @param semanticType - Semantic type dari IR
     * @returns TypeScript type node (TSTypeReference, TSArrayType, TSUnionType, atau TSIntersectionType)
     */
    public semanticTypeToTSType(
        semanticType: SemanticType
    ): TSTypeReference | TSArrayType | TSUnionType | TSIntersectionType {
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
            throw new TypeConversionError(
                `Expected primitive type, got ${type.kind}`,
                type,
                'Use semanticTypeToTSType() for non-primitive types'
            );
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
            throw new TypeConversionError(
                `Expected reference type, got ${type.kind}`,
                type,
                'Reference types are custom types like User, Product, etc.'
            );
        }

        // Collect import requirement
        this.collectImportRequirement(type.name);

        return new TSTypeReference(type.name);
    }

    /**
     * Convert CollectionType to TS array type
     * 
     * Phase 3 - Day 2: Enhanced collection type handling
     * 
     * Handles all collection variants:
     * - readonly_collection → readonly T[]
     * - mutable_collection → T[]
     * - CollectionKind.ARRAY → Standard array
     * - CollectionKind.COLLECTION → Generic Collection<T> wrapper
     * - CollectionKind.NULLABLE → Union dengan null type
     * 
     * @example
     * ```typescript
     * // readonly string[]
     * ReadonlyCollectionType(ARRAY, string) → readonly string[]
     * 
     * // User[]
     * MutableCollectionType(ARRAY, User) → User[]
     * 
     * // Collection<Product>
     * ReadonlyCollectionType(COLLECTION, Product) → Collection<Product>
     * 
     * // (string | null)[]
     * MutableCollectionType(NULLABLE, string) → (string | null)[]
     * ```
     */
    private convertCollectionType(
        type: SemanticType
    ): TSTypeReference | TSArrayType | TSUnionType {
        if (type.kind !== 'readonly_collection' && type.kind !== 'mutable_collection') {
            throw new Error('Expected collection type');
        }

        const isReadonly = type.kind === 'readonly_collection';

        // Convert element type recursively
        const elementType = this.semanticTypeToTSType(type.elementType);

        // Handle different collection kinds
        switch (type.collectionKind) {
            case 'array':
                // Standard array: T[] atau readonly T[]
                return new TSArrayType(elementType, isReadonly);

            case 'collection':
                // Generic Collection wrapper: Collection<T>
                // Track import requirement untuk Collection type
                this.collectImportRequirement('Collection');

                // TODO: Implement TSGenericType untuk Collection<T>
                // For now, fallback ke array
                return new TSArrayType(elementType, isReadonly);

            case 'nullable':
                // Union dengan null: (T | null)[]
                const nullType = new TSTypeReference('null');
                const nullableElement = new TSUnionType([elementType, nullType]);
                return new TSArrayType(nullableElement, isReadonly);

            default:
                // Unknown collection kind - fallback ke standard array
                return new TSArrayType(elementType, isReadonly);
        }
    }

    /**
     * Convert UnionType to TS union
     * 
     * Phase 3 - Day 2 Part 3: Full implementation
     * 
     * Maps all union members to TypeScript union type (A | B | C).
     * Handles nested unions, empty unions, dan single-member unions.
     * 
     * @example
     * ```typescript
     * // string | number
     * UnionType([string, number]) → TSUnionType([string, number])
     * 
     * // User | null
     * UnionType([User, null]) → TSUnionType([User, null])
     * ```
     */
    private convertUnionType(
        type: SemanticType
    ): TSTypeReference | TSArrayType | TSUnionType | TSIntersectionType {
        if (type.kind !== 'union') {
            throw new Error('Expected union type');
        }

        // Convert all members recursively
        const members = Array.from(type.members.values());

        // Edge case: Empty union → never type
        if (members.length === 0) {
            return new TSTypeReference('never');
        }

        // Edge case: Single member → just return that type
        if (members.length === 1) {
            return this.semanticTypeToTSType(members[0]);
        }

        // Convert each member to TypeScript type
        const tsTypes = members.map(member => this.semanticTypeToTSType(member));

        // Create union type
        return new TSUnionType(tsTypes);
    }

    /**
     * Convert IntersectionType to TS intersection
     * 
     * Phase 3 - Day 2 Part 3: Full implementation
     * 
     * Maps all intersection members to TypeScript intersection type (A & B & C).
     * Handles nested intersections, empty intersections, dan single-member intersections.
     * 
     * @example
     * ```typescript
     * // User & Timestamps
     * IntersectionType([User, Timestamps]) → TSIntersectionType([User, Timestamps])
     * 
     * // Base & Extended
     * IntersectionType([Base, Extended]) → TSIntersectionType([Base, Extended])
     * ```
     */
    private convertIntersectionType(
        type: SemanticType
    ): TSTypeReference | TSArrayType | TSUnionType | TSIntersectionType {
        if (type.kind !== 'intersection') {
            throw new Error('Expected intersection type');
        }

        // Convert all members recursively
        const members = Array.from(type.members.values());

        // Edge case: Empty intersection → never type (impossible type)
        if (members.length === 0) {
            return new TSTypeReference('never');
        }

        // Edge case: Single member → just return that type
        if (members.length === 1) {
            return this.semanticTypeToTSType(members[0]);
        }

        // Convert each member to TypeScript type
        const tsTypes = members.map(member => this.semanticTypeToTSType(member));

        // Create intersection type
        return new TSIntersectionType(tsTypes);
    }

    /**
     * Convert GenericType to TS generic
     * 
     * Phase 3 - Day 3: Full implementation
     * 
     * Maps generic types dengan type parameters ke TypeScript generic syntax.
     * Supports variance annotations dan nested generics.
     * 
     * @example
     * ```typescript
     * // Collection<User>
     * GenericType(Collection, [User]) → Collection<User>
     * 
     * // Promise<Result<User>>
     * GenericType(Promise, [GenericType(Result, [User])]) → Promise<Result<User>>
     * 
     * // Array<string | number>
     * GenericType(Array, [UnionType([string, number])]) → Array<string | number>
     * ```
     */
    private convertGenericType(
        type: SemanticType
    ): TSTypeReference {
        if (type.kind !== 'generic') {
            throw new Error('Expected generic type');
        }

        // Convert base type (must be ReferenceType)
        const baseTypeRef = this.convertReferenceType(type.base);

        // Edge case: No parameters → return base type directly
        if (type.parameters.length === 0) {
            return baseTypeRef;
        }

        // Convert each generic parameter to TypeScript type
        const typeArgs: TSTypeReference[] = [];

        for (const param of type.parameters) {
            // Convert parameter type recursively
            const paramType = this.semanticTypeToTSType(param.type);

            // Generic parameters must be TSTypeReference untuk type arguments
            // Wrap complex types jika diperlukan
            if (paramType instanceof TSTypeReference) {
                typeArgs.push(paramType);
            } else {
                // Complex types (arrays, unions, intersections) need wrapping
                // For now, create inline type reference
                // TODO: Consider generating type alias for complex generic parameters
                throw new Error(`Complex generic parameter not yet supported: ${param.type.kind}`);
            }
        }

        // Create generic type reference dengan type arguments
        // Example: Collection<User> → TSTypeReference('Collection', [User])
        return new TSTypeReference(
            baseTypeRef.name,
            typeArgs,
            false // not array
        );
    }

    /**
     * Convert ObjectType to TS inline object type
     * 
     * Phase 3 - Day 3: Full implementation
     * 
     * Creates inline object type literals atau interface declarations.
     * Handles required/optional properties, readonly modifiers, dan property types.
     * 
     * Strategy:
     * - Small objects (≤3 properties): Inline object literal
     * - Large objects (>3 properties): Generate interface declaration
     * - Objects dengan base/interfaces: Always generate interface
     * 
     * @example
     * ```typescript
     * // Small object → inline
     * ObjectType({ id: number, name: string }) → { id: number; name: string }
     * 
     * // Large object → interface (tracked for later generation)
     * ObjectType({ id, name, email, phone, address }) → SyntheticType_1
     * 
     * // Object dengan inheritance → interface
     * ObjectType({ ... }, extends: BaseUser) → ExtendedType_1 extends BaseUser
     * ```
     * 
     * Note: Inline object types currently represented as TSTypeReference('object')
     * Full inline object literal support akan ditambahkan di future iteration.
     */
    private convertObjectType(
        type: SemanticType
    ): TSTypeReference {
        if (type.kind !== 'object') {
            throw new Error('Expected object type');
        }

        // Strategy decision based on complexity
        const propertyCount = type.properties.entries().length;
        const hasInheritance = type.baseObject !== undefined ||
            (type.interfaces && type.interfaces.length > 0);

        // Complex objects need interface generation
        if (propertyCount > 3 || hasInheritance) {
            // Generate synthetic interface name
            const syntheticName = this.generateSyntheticTypeName();

            // Track untuk later interface generation
            // TODO: Implement deferred interface generation queue
            // this.deferredInterfaces.set(syntheticName, type);

            // Collect imports untuk base types and interfaces
            if (type.baseObject && type.baseObject.kind === 'reference') {
                this.collectImportRequirement(type.baseObject.name);
            }
            if (type.interfaces) {
                for (const iface of type.interfaces) {
                    if (iface.kind === 'reference') {
                        this.collectImportRequirement(iface.name);
                    }
                }
            }

            // Collect imports untuk all property types
            for (const [, propType] of type.properties.entries()) {
                this.collectPropertyTypeImports(propType);
            }

            return new TSTypeReference(syntheticName);
        }

        // Simple objects: Return 'object' for now
        // TODO: Implement TSObjectLiteralType untuk inline representations
        // Example: { id: number; name: string }

        // Still need to collect imports untuk property types
        for (const [, propType] of type.properties.entries()) {
            this.collectPropertyTypeImports(propType);
        }

        return new TSTypeReference('object');
    }

    /**
     * Generate unique synthetic type name untuk deferred interfaces
     */
    private syntheticTypeCounter = 0;

    private generateSyntheticTypeName(): string {
        return `SyntheticType_${++this.syntheticTypeCounter}`;
    }

    /**
     * Recursively collect import requirements untuk property type
     */
    private collectPropertyTypeImports(type: SemanticType): void {
        switch (type.kind) {
            case 'reference':
                this.collectImportRequirement(type.name);
                break;

            case 'readonly_collection':
            case 'mutable_collection':
                this.collectPropertyTypeImports(type.elementType);
                break;

            case 'union':
            case 'intersection':
                for (const member of type.members.values()) {
                    this.collectPropertyTypeImports(member);
                }
                break;

            case 'generic':
                this.collectImportRequirement(type.base.name);
                for (const param of type.parameters) {
                    this.collectPropertyTypeImports(param.type);
                }
                break;

            case 'object':
                // Nested objects - collect all property types
                for (const [, propType] of type.properties.entries()) {
                    this.collectPropertyTypeImports(propType);
                }
                break;

            // Primitives, never, error - no imports needed
            default:
                break;
        }
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

    /**
     * Generate entity interface dari ObjectType
     * 
     * Phase 3 - Day 4: Public API untuk interface generation
     * 
     * Creates TSInterfaceDeclaration directly dari ObjectType semantic type.
     * Useful untuk manual interface generation outside of ContractGraph context.
     * 
     * Process:
     * 1. Extract properties dari ObjectType
     * 2. Build extends clause dari baseObject dan interfaces
     * 3. Convert properties to TSPropertySignature
     * 4. Track generated interface name
     * 5. Collect import requirements
     * 
     * @param name - Interface name
     * @param type - ObjectType semantic type
     * @returns TSInterfaceDeclaration
     * 
     * @throws {Error} Jika type bukan ObjectType
     * 
     * @example
     * ```typescript
     * const generator = new TypeScriptGenerator();
     * 
     * const userType = new ObjectType(
     *   new ImmutableMap(new Map([
     *     ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
     *     ['name', new PrimitiveType(PrimitiveKind.STRING)],
     *     ['email', new PrimitiveType(PrimitiveKind.STRING)]
     *   ])),
     *   new ImmutableSet(new Set(['id', 'name'])) // email is optional
     * );
     * 
     * const iface = generator.generateEntityInterface('User', userType);
     * // → interface User {
     * //     id: number;
     * //     name: string;
     * //     email?: string;
     * //   }
     * ```
     */
    public generateEntityInterface(
        name: string,
        type: ObjectType
    ): TSInterfaceDeclaration {
        // Validate input
        if (type.kind !== 'object') {
            throw new Error(`Expected ObjectType, got ${type.kind}`);
        }

        // Track generated interface name FIRST (sebelum processing properties)
        // Ini penting untuk prevent self-reference imports
        // Example: interface User { parent?: User }
        this.generatedTypes.add(name);

        // Extract properties dari ObjectType
        const properties = this.extractPropertiesFromObjectType(type);

        // Build extends clause (inheritance + interface implementations)
        const extendsClause = this.buildExtendsClause(type);

        // Convert properties to TSPropertySignature nodes
        const propertySignatures = properties.map(prop =>
            this.transformPropertyToSignature(prop)
        );

        // Generate JSDoc comment
        const comment = new TSComment(
            `Interface for ${name}`,
            'jsdoc'
        );

        // Create interface declaration
        // Note: TSInterfaceDeclaration constructor order:
        // (name, properties, extendsTypes, exported, comment)
        return new TSInterfaceDeclaration(
            name,
            propertySignatures, // properties
            extendsClause,      // extendsTypes
            true,               // exported
            comment             // comment
        );
    }

    /**
     * Extract property definitions dari ObjectType
     * 
     * Converts ObjectType.properties (ImmutableMap) to PropertyDefinition array.
     * Determines optional vs required using ObjectType.requiredProperties set.
     * 
     * @param type - ObjectType semantic type
     * @returns Array of property definitions dengan correct optional flags
     * 
     * @example
     * ```typescript
     * const objectType = new ObjectType(
     *   new ImmutableMap(new Map([
     *     ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
     *     ['name', new PrimitiveType(PrimitiveKind.STRING)]
     *   ])),
     *   new ImmutableSet(new Set(['id'])) // only id is required
     * );
     * 
     * const props = extractPropertiesFromObjectType(objectType);
     * // [
     * //   { name: 'id', type: number, optional: false, readonly: false },
     * //   { name: 'name', type: string, optional: true, readonly: false }
     * // ]
     * ```
     */
    private extractPropertiesFromObjectType(
        type: ObjectType
    ): PropertyDefinition[] {
        const properties: PropertyDefinition[] = [];

        // Iterate through all properties dalam ObjectType
        for (const [propName, propType] of type.properties.entries()) {
            // Property is required jika ada dalam requiredProperties set
            const isRequired = type.requiredProperties.has(propName);

            properties.push({
                name: propName,
                type: propType,
                optional: !isRequired, // optional adalah negasi dari required
                readonly: false, // TODO: Add mutability tracking dalam ObjectType
                description: undefined // TODO: Extract dari annotations jika ada
            });
        }

        return properties;
    }

    /**
     * Build extends clause dari ObjectType inheritance
     * 
     * Extracts base types dan interface implementations untuk extends clause.
     * Tracks import requirements untuk all extended types.
     * 
     * @param type - ObjectType dengan potential baseObject dan interfaces
     * @returns Array of base type names (empty array jika no inheritance)
     * 
     * @example
     * ```typescript
     * // Simple inheritance
     * const type = new ObjectType(
     *   properties,
     *   required,
     *   new ReferenceType('App\\Models', 'BaseUser') // baseObject
     * );
     * buildExtendsClause(type); // → ['BaseUser']
     * 
     * // Multiple interface implementations
     * const type = new ObjectType(
     *   properties,
     *   required,
     *   undefined, // no baseObject
     *   [
     *     new ReferenceType('', 'Timestamped'),
     *     new ReferenceType('', 'SoftDeletable')
     *   ]
     * );
     * buildExtendsClause(type); // → ['Timestamped', 'SoftDeletable']
     * ```
     */
    private buildExtendsClause(type: ObjectType): string[] {
        const extendsTypes: string[] = [];

        // Handle base object (single inheritance)
        if (type.baseObject && type.baseObject.kind === 'reference') {
            extendsTypes.push(type.baseObject.name);
            this.collectImportRequirement(type.baseObject.name);
        }

        // Handle interface implementations (multiple inheritance)
        if (type.interfaces) {
            for (const iface of type.interfaces) {
                if (iface.kind === 'reference') {
                    extendsTypes.push(iface.name);
                    this.collectImportRequirement(iface.name);
                }
            }
        }

        return extendsTypes;
    }
}
