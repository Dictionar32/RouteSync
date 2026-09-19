/**
 * ResourceFieldFlattener.ts
 *
 * Flattens verified ResourceFieldDescriptor trees.
 * The flattener never inspects unknown runtime shapes: the semantic ADT
 * established by the scanner is the only input vocabulary.
 */

import { toCamelCase } from '../../../utils/resource-naming';
import type { ResourceFieldDescriptor } from '../../../types/domain/expressions';
import type { ResourceExpressionFieldModel, ResourceExpressionModel } from '../../../types/domain/resourceExpressionModel';
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
    constructor({ maxDepth = 5 }: ResourceFieldFlattenerDependencies = {}) {
        this.maxDepth = maxDepth;
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
        const fieldName = field.name.value;
        const camelKey = toCamelCase(fieldName);
        const targetProperty = parentTarget.length > 0
            ? `${parentTarget}${camelKey.charAt(0).toUpperCase()}${camelKey.slice(1)}`
            : camelKey;
        const sourcePath = parentSource.length > 0
            ? `${parentSource}.${fieldName}`
            : fieldName;

        matchResourceFieldExpression(field.expression, {
            primitive: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            model: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            resource: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            object: expression => expression.fields.forEach(child => this.flattenExpressionField(child, targetProperty, sourcePath, depth + 1, result)),
            array: expression => expression.entries.forEach(entry => this.pushArray(field, entry.value, targetProperty, sourcePath, result)),
            property_access: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            nullsafe_property_access: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            variable: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            type_cast: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            binary_expression: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            method_call: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            nullsafe_method_call: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            static_method_call: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            array_access: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            function_call: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            ternary: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            short_ternary: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            null_coalesce: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            literal: () => this.pushLeaf(field, targetProperty, sourcePath, result),
            unsupported: () => this.pushLeaf(field, targetProperty, sourcePath, result)
        });
    }

    private pushArray(
        field: ResourceFieldDescriptor,
        element: ResourceExpressionModel,
        targetProperty: string,
        sourcePath: string,
        result: FlattenedField[]
    ): void {
        const elementType = this.requireResolvedExpressionType(element);
        const collection = ResolvedCollectionType.of(elementType);
        const type = this.isNullable(field) ? ResolvedNullableType.of(collection) : collection;
        result.push(new FlattenedField({
            targetProperty,
            sourcePath,
            type,
            nullable: this.isNullable(field)
        }));
    }

    private pushLeaf(
        field: ResourceFieldDescriptor,
        targetProperty: string,
        sourcePath: string,
        result: FlattenedField[]
    ): void {
        const resolved = this.requireResolvedType(field);
        const type = this.isNullable(field)
            ? ResolvedNullableType.of(resolved)
            : resolved;
        result.push(new FlattenedField({
            targetProperty,
            sourcePath,
            type,
            nullable: this.isNullable(field)
        }));
    }

    private flattenExpressionField(
        field: ResourceExpressionFieldModel,
        parentTarget: string,
        parentSource: string,
        depth: number,
        result: FlattenedField[]
    ): void {
        const name = field.name.value;
        const camelKey = toCamelCase(name);
        const targetProperty = parentTarget.length > 0
            ? `${parentTarget}${camelKey.charAt(0).toUpperCase()}${camelKey.slice(1)}`
            : camelKey;
        const sourcePath = parentSource.length > 0 ? `${parentSource}.${name}` : name;
        matchResourceFieldExpression(field.value.expression, {
            object: expression => expression.fields.forEach(child => this.flattenExpressionField(child, targetProperty, sourcePath, depth + 1, result)),
            array: expression => expression.entries.forEach(entry => this.pushExpressionArray(entry.value, targetProperty, sourcePath, result)),
            primitive: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            model: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            resource: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            property_access: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            nullsafe_property_access: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            variable: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            type_cast: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            binary_expression: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            method_call: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            nullsafe_method_call: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            static_method_call: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            array_access: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            function_call: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            ternary: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            short_ternary: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            null_coalesce: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            literal: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result),
            unsupported: () => this.pushExpressionLeaf(field.value, targetProperty, sourcePath, result)
        });
    }

    private pushExpressionArray(element: ResourceExpressionModel, targetProperty: string, sourcePath: string, result: FlattenedField[]): void {
        const elementType = this.requireResolvedExpressionType(element);
        result.push(new FlattenedField({ targetProperty, sourcePath, type: ResolvedCollectionType.of(elementType), nullable: this.expressionIsNullable(element) }));
    }

    private pushExpressionLeaf(expression: ResourceExpressionModel, targetProperty: string, sourcePath: string, result: FlattenedField[]): void {
        const resolved = this.requireResolvedExpressionType(expression);
        const nullable = this.expressionIsNullable(expression);
        result.push(new FlattenedField({ targetProperty, sourcePath, type: nullable ? ResolvedNullableType.of(resolved) : resolved, nullable }));
    }

    private requireResolvedExpressionType(expression: ResourceExpressionModel): ResolvedSemanticType {
        if (expression.semantic.kind !== 'known') {
            throw new Error(`Resource expression requires binding: ${expression.semantic.kind}`);
        }
        return new SemanticTypeResolver({}).resolve(expression.semantic.type);
    }

    private expressionIsNullable(expression: ResourceExpressionModel): boolean {
        if (expression.semantic.kind !== 'known') {
            throw new Error(`Resource expression requires binding: ${expression.semantic.kind}`);
        }
        return expression.semantic.type.isNullable();
    }

    private requireResolvedType(field: ResourceFieldDescriptor): ResolvedSemanticType {
        if (field.semantic.kind === 'rejected') {
            throw new Error(`Resource field semantic rejected: ${field.semantic.bound.reason}`);
        }
        return new SemanticTypeResolver({}).resolve(field.semantic.type);
    }

    private isNullable(field: ResourceFieldDescriptor): boolean {
        if (field.semantic.kind === 'rejected') {
            throw new Error(`Resource field semantic rejected: ${field.semantic.bound.reason}`);
        }
        return field.semantic.type.isNullable();
    }

}
