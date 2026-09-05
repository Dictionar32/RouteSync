/**
 * resourceDescriptors.ts
 *
 * AST descriptors for Eloquent JsonResources and resource fields.
 *
 * @module core/compiler/scanner/descriptors/resourceDescriptors
 */

import {
    ResourceFieldDescriptor,
    ResourceFieldExpression,
    ParsedResource,
    ActionDefinition,
    ResourceAssignment
} from "../../../types/route";
import { PrimitiveKind } from "../../types/SemanticType";
import { toCamelCase, ResourceNamingConvention } from "../../../utils/resource-naming";

export interface ScannedResourceFieldParams {
    readonly name: string;
    readonly propertyName: string;
    readonly expression: ResourceFieldExpression;
    readonly semanticType: PrimitiveKind;
    readonly nullable: boolean;
}

/**
 * Reusable Constructor: Scanned Resource Field Descriptor.
 */
export class ScannedResourceFieldDescriptor implements ResourceFieldDescriptor {
    public readonly name: string;
    public readonly propertyName: string;
    public readonly expression: ResourceFieldExpression;
    public readonly semanticType: PrimitiveKind;
    public readonly nullable: boolean;

    constructor({
        name,
        propertyName,
        expression,
        semanticType,
        nullable
    }: ScannedResourceFieldParams) {
        this.name = name;
        this.propertyName = propertyName;
        this.expression = expression;
        this.semanticType = semanticType;
        this.nullable = nullable;
        Object.freeze(this);
    }

    public static fromExpression(
        name: string,
        expression: ResourceFieldExpression,
        nullable: boolean = false,
        propertyName: string = toCamelCase(name),
        semanticType?: PrimitiveKind
    ): ScannedResourceFieldDescriptor {
        const resolvedSemanticType = semanticType ?? (
            expression.kind === "primitive" && (Object.values(PrimitiveKind) as string[]).includes(expression.type)
                ? (expression.type as PrimitiveKind)
                : PrimitiveKind.STRING
        );
        return new ScannedResourceFieldDescriptor({
            name,
            propertyName,
            expression,
            semanticType: resolvedSemanticType,
            nullable
        });
    }

    public static create({
        name,
        expression,
        nullable = false,
        propertyName = toCamelCase(name),
        semanticType
    }: {
        readonly name: string;
        readonly expression: ResourceFieldExpression;
        readonly nullable?: boolean;
        readonly propertyName?: string;
        readonly semanticType?: PrimitiveKind;
    }): ScannedResourceFieldDescriptor {
        return ScannedResourceFieldDescriptor.fromExpression(name, expression, nullable, propertyName, semanticType);
    }
}

export interface ScannedResourceParams {
    readonly name: string;
    readonly baseName: string;
    readonly typeName: string;
    readonly baseModel: string | null;
    readonly fields: readonly ResourceFieldDescriptor[];
    readonly assignments: readonly ResourceAssignment[];
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly isSynthetic: boolean;
}

/**
 * Reusable Constructor: Scanned Resource Descriptor.
 */
export class ScannedResourceDescriptor implements ParsedResource {
    public readonly name: string;
    public readonly baseName: string;
    public readonly typeName: string;
    public readonly sanitizedName: string;
    public readonly baseModel: string | null;
    public readonly actions: readonly ActionDefinition[];
    public readonly endpoints: readonly string[];
    public readonly fields: readonly ResourceFieldDescriptor[];
    public readonly assignments: readonly ResourceAssignment[];
    public readonly sourceFile: string;
    public readonly sourceLine: number;
    public readonly isSynthetic: boolean;

    constructor({
        name,
        baseName,
        typeName,
        baseModel,
        fields,
        assignments,
        sourceFile,
        sourceLine,
        isSynthetic
    }: ScannedResourceParams) {
        this.name = name;
        this.baseName = baseName;
        this.typeName = typeName;
        this.sanitizedName = toCamelCase(name);
        this.baseModel = baseModel;
        this.actions = Object.freeze([]);
        this.endpoints = Object.freeze([]);
        this.fields = Object.freeze(fields);
        this.assignments = Object.freeze(assignments);
        this.sourceFile = sourceFile;
        this.sourceLine = sourceLine;
        this.isSynthetic = isSynthetic;
        Object.freeze(this);
    }

    public static create({
        name,
        fields,
        sourceFile = "",
        sourceLine = 0,
        assignments = []
    }: {
        readonly name: string;
        readonly fields: readonly ResourceFieldDescriptor[];
        readonly sourceFile?: string;
        readonly sourceLine?: number;
        readonly assignments?: readonly ResourceAssignment[];
    }): ScannedResourceDescriptor {
        const baseName = ResourceNamingConvention.stripSuffix(name);
        return new ScannedResourceDescriptor({
            name,
            baseName,
            typeName: ResourceNamingConvention.toTransformedName(baseName),
            baseModel: baseName,
            fields,
            assignments,
            sourceFile,
            sourceLine,
            isSynthetic: false
        });
    }
}
