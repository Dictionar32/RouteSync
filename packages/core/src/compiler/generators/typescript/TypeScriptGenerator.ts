/**
 * @file TypeScriptGenerator.ts
 * @description Active Consumer Orchestrator: transforms ContractGraph IR to TypeScript Target AST
 *
 * Consumes focused sub-domains from ./domain/ with pure dataflow declaration.
 * 0 inline parsing, 0 defensive fallback, 0 wildcard re-exports.
 *
 * @module compiler/generators/typescript/TypeScriptGenerator
 */

import type { ContractGraph } from '../../ir/ContractGraph';
import type { SemanticType, ObjectType } from '../../types/SemanticType';
import type { IGenerator } from '../IGenerator';
import { TSFile } from '../../target/typescript/nodes/TSFile';
import type { TSInterfaceDeclaration } from '../../target/typescript/nodes/TSInterfaceDeclaration';
import type { TSTypeReference } from '../../target/typescript/nodes/TSTypeReference';
import type { TSArrayType } from '../../target/typescript/nodes/TSArrayType';
import type { TSUnionType } from '../../target/typescript/nodes/TSUnionType';
import type { TSIntersectionType } from '../../target/typescript/nodes/TSIntersectionType';
import type { ImportSpec } from './ImportCollector';

// Sub-domain domain consumers
import { TypeConversionError, InterfaceGenerationError } from './domain/generatorErrors';
import { ImportTracker } from './domain/ImportTracker';
import { TypeConverter } from './domain/TypeConverter';
import { InterfaceBuilder } from './domain/InterfaceBuilder';

export { TypeConversionError, InterfaceGenerationError };

/**
 * TypeScript Generator Orchestrator - Pure Consumer
 */
export class TypeScriptGenerator implements IGenerator<ContractGraph, TSFile> {
    private readonly generatedTypes: Set<string>;
    private readonly importTracker: ImportTracker;
    private readonly typeConverter: TypeConverter;
    private readonly interfaceBuilder: InterfaceBuilder;

    constructor() {
        this.generatedTypes = new Set<string>();
        this.importTracker = new ImportTracker();
        this.typeConverter = new TypeConverter(this.importTracker, this.generatedTypes);
        this.interfaceBuilder = new InterfaceBuilder(this.typeConverter, this.importTracker, this.generatedTypes);
    }

    /**
     * Reset generator state for clean reuse
     */
    public reset(): void {
        this.generatedTypes.clear();
        this.importTracker.reset();
        this.typeConverter.reset();
    }

    /**
     * Pure Flow Declaration:
     *   graph -> buildDeclarations -> buildImports -> TSFile
     */
    public generate(graph: ContractGraph): TSFile {
        this.reset();
        const declarations = this.interfaceBuilder.buildDeclarationsFromGraph(graph);
        const imports = this.importTracker.buildImportDeclarations();
        return new TSFile(imports, declarations);
    }

    /**
     * Delegate semantic type mapping to TypeConverter sub-domain
     */
    public semanticTypeToTSType(
        semanticType: SemanticType
    ): TSTypeReference | TSArrayType | TSUnionType | TSIntersectionType {
        return this.typeConverter.semanticTypeToTSType(semanticType);
    }

    /**
     * Delegate entity interface generation to InterfaceBuilder sub-domain
     */
    public generateEntityInterface(
        name: string,
        type: ObjectType
    ): TSInterfaceDeclaration {
        return this.interfaceBuilder.generateEntityInterface(name, type);
    }

    /**
     * Get collected imports from ImportTracker sub-domain
     */
    public getImports(): readonly ImportSpec[] {
        return this.importTracker.getImports();
    }

    /**
     * Compatibility getter for internal importCollector instance
     */
    public get importCollector() {
        return this.importTracker.collector;
    }

    /**
     * Compatibility delegator for primitive type conversion
     */
    public convertPrimitiveType(type: SemanticType): TSTypeReference {
        return this.typeConverter.convertPrimitiveType(type);
    }
}
