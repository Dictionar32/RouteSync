/**
 * @file InterfaceBuilder.ts
 * @description Sub-domain generator for TSInterfaceDeclaration and TSPropertySignature
 *
 * @module compiler/generators/typescript/domain/InterfaceBuilder
 */

import type { EntityNode, ContractGraph } from '../../../ir/ContractGraph';
import type { ObjectType } from '../../../types/SemanticType';
import { TSInterfaceDeclaration } from '../../../target/typescript/nodes/TSInterfaceDeclaration';
import { TSPropertySignature } from '../../../target/typescript/nodes/TSPropertySignature';
import { TSComment } from '../../../target/typescript/nodes/TSComment';
import { InterfaceGenerationError, type PropertyDefinition } from './generatorErrors';
import type { TypeConverter } from './TypeConverter';
import type { ImportTracker } from './ImportTracker';

export class InterfaceBuilder {
    constructor(
        private readonly typeConverter: TypeConverter,
        private readonly importTracker: ImportTracker,
        private readonly generatedTypes: Set<string>
    ) {}

    public buildDeclarationsFromGraph(graph: ContractGraph): TSInterfaceDeclaration[] {
        const declarations: TSInterfaceDeclaration[] = [];
        for (const [, node] of graph.nodes.entries()) {
            if (node.kind === 'entity') {
                declarations.push(this.transformEntityToInterface(node));
                this.generatedTypes.add(node.name);
            }
        }
        return declarations;
    }

    public transformEntityToInterface(entity: EntityNode): TSInterfaceDeclaration {
        const properties = this.extractProperties(entity);
        const propertySignatures = properties.map(prop => this.transformPropertyToSignature(prop));
        const comment = new TSComment(`Interface for ${entity.name}`, 'jsdoc');

        return new TSInterfaceDeclaration(
            entity.name,
            propertySignatures,
            [],
            true,
            comment
        );
    }

    public generateEntityInterface(name: string, type: ObjectType): TSInterfaceDeclaration {
        try {
            if (type.kind !== 'object') {
                throw new InterfaceGenerationError(`Expected ObjectType, got ${type.kind}`, name);
            }

            this.generatedTypes.add(name);
            const properties = this.extractPropertiesFromObjectType(type);
            const extendsClause = this.buildExtendsClause(type);
            const propertySignatures = properties.map(prop => this.transformPropertyToSignature(prop));
            const comment = new TSComment(`Interface for ${name}`, 'jsdoc');

            return new TSInterfaceDeclaration(
                name,
                propertySignatures,
                extendsClause,
                true,
                comment
            );
        } catch (error) {
            if (error instanceof InterfaceGenerationError) {
                throw error;
            }
            throw new InterfaceGenerationError(
                `Failed to generate interface: ${error instanceof Error ? error.message : String(error)}`,
                name,
                error instanceof Error ? error : undefined
            );
        }
    }

    public transformPropertyToSignature(prop: PropertyDefinition): TSPropertySignature {
        const tsType = this.typeConverter.semanticTypeToTSType(prop.type);
        const comment = prop.description ? new TSComment(prop.description, 'single-line') : undefined;

        return new TSPropertySignature(
            prop.name,
            tsType,
            prop.optional,
            prop.readonly,
            comment
        );
    }

    private extractProperties(entity: EntityNode): PropertyDefinition[] {
        const properties: PropertyDefinition[] = [];
        for (const [name, type] of entity.properties.entries()) {
            properties.push({
                name,
                type,
                optional: false,
                readonly: false,
                description: undefined
            });
        }
        return properties;
    }

    private extractPropertiesFromObjectType(type: ObjectType): PropertyDefinition[] {
        const properties: PropertyDefinition[] = [];
        for (const property of type.properties) {
            properties.push({
                name: property.name,
                type: property.type,
                optional: !property.required,
                readonly: false,
                description: undefined
            });
        }
        return properties;
    }

    private buildExtendsClause(type: ObjectType): string[] {
        const extendsTypes: string[] = [];
        if (type.baseObject && type.baseObject.kind === 'reference') {
            extendsTypes.push(type.baseObject.name);
            this.importTracker.collectImportRequirement(type.baseObject.name, this.generatedTypes);
        }
        if (type.interfaces) {
            for (const iface of type.interfaces) {
                if (iface.kind === 'reference') {
                    extendsTypes.push(iface.name);
                    this.importTracker.collectImportRequirement(iface.name, this.generatedTypes);
                }
            }
        }
        return extendsTypes;
    }
}
