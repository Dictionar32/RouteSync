/**
 * ResourceFieldFlattener.ts
 *
 * Flattens verified ResourceFieldDescriptor trees.
 * The flattener never inspects unknown runtime shapes: the semantic ADT
 * established by the scanner is the only input vocabulary.
 */

import { toCamelCase, toPascalCase } from '../../../utils/resource-naming';
import type { ResourceFieldDescriptor } from '../../../types/domain/expressions';
import type { SemanticType } from '../../../types/SemanticType';
import { matchResourceFieldExpression } from '../../../types/domain/expressions';
import { SemanticTypeResolver } from './SemanticTypeResolver';
import {
    ResolvedSemanticType,
    ResolvedNullableType,
    ResolvedCollectionType
} from './ResolvedSemanticType';

export interface FlattenedFieldParams {
    readonly targetProperty: string;
    readonly sourcePath: string;
    readonly type: ResolvedSemanticType;
    readonly nullable: boolean;
}

export class FlattenedField {
    public readonly targetProperty: string;
    public readonly sourcePath: string;
    public readonly type: ResolvedSemanticType;
    public readonly nullable: boolean;

    constructor(params: FlattenedFieldParams) {
        this.targetProperty = params.targetProperty;
        this.sourcePath = params.sourcePath;
        this.type = params.type;
        this.nullable = params.nullable;
        Object.freeze(this);
    }
}

export interface ResourceFieldFlattenerDependencies {
    readonly maxDepth?: number;
    readonly typeResolver?: SemanticTypeResolver;
}

export class ResourceFieldFlattener {
    public readonly maxDepth: number;
    private readonly typeResolver: SemanticTypeResolver;

    constructor({ maxDepth = 5, typeResolver = SemanticTypeResolver.default() }: ResourceFieldFlattenerDependencies = {}) {
        this.maxDepth = maxDepth;
        this.typeResolver = typeResolver;
        Object.freeze(this);
    }

    flatten(
        fields: readonly ResourceFieldDescriptor[],
        parentTarget = '',
        parentSource = '',
        depth = 0
    ): readonly FlattenedField[] {
        if (depth >= this.maxDepth) return Object.freeze([]);

        const result: FlattenedField[] = [];
        for (const field of fields) {
            this.flattenField(field, parentTarget, parentSource, depth, result);
        }
        return Object.freeze(result);
    }

    private flattenField(
        field: ResourceFieldDescriptor,
        parentTarget: string,
        parentSource: string,
        depth: number,
        result: FlattenedField[]
    ): void {
        const camelKey = toCamelCase(field.name);
        const targetProperty = parentTarget.length > 0
            ? `${parentTarget}${camelKey.charAt(0).toUpperCase()}${camelKey.slice(1)}`
            : camelKey;
        const sourcePath = parentSource.length > 0
            ? `${parentSource}.${field.name}`
            : field.name;

        matchResourceFieldExpression(field.expression, {
            primitive: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            model: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            resource: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            object: expression => this.flatten(expression.fields, targetProperty, sourcePath, depth + 1)
                .forEach(flattened => result.push(flattened)),
            array: expression => this.pushArray(field, expression.element, targetProperty, sourcePath, result),
            property_access: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            nullsafe_property_access: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            variable: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            type_cast: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            binary_expression: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            method_call: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            nullsafe_method_call: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            static_method_call: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            literal: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            unsupported: () => this.pushLeaf(field, targetProperty, sourcePath, result)
        });
    }

    private pushArray(
        field: ResourceFieldDescriptor,
        element: ResourceFieldDescriptor,
        targetProperty: string,
        sourcePath: string,
        result: FlattenedField[]
    ): void {
        const elementType = this.resolveSemanticType(element.semanticType);
        const collection = ResolvedCollectionType.of(elementType);
        const type = field.nullable ? ResolvedNullableType.of(collection) : collection;
        result.push(new FlattenedField({
            targetProperty,
            sourcePath,
            type,
            nullable: field.nullable
        }));
    }

    private pushLeaf(
        field: ResourceFieldDescriptor,
        targetProperty: string,
        sourcePath: string,
        result: FlattenedField[]
    ): void {
        const type = field.nullable
            ? ResolvedNullableType.of(this.resolveSemanticType(field.semanticType))
            : this.resolveSemanticType(field.semanticType);
        result.push(new FlattenedField({
            targetProperty,
            sourcePath,
            type,
            nullable: field.nullable
        }));
    }

    private resolveSemanticType(type: SemanticType): ResolvedSemanticType {
        return this.typeResolver.resolve(type);
    }

}
