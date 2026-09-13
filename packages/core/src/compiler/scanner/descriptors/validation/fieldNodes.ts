/**
 * fieldNodes.ts
 *
 * Scanned AST nodes for scalar, object, and array validation fields.
 *
 * @module core/compiler/scanner/descriptors/validation
 */

import {
    ValidationRuleNode,
    ValidationFieldNode
} from "../../../../types/route";
import { toCamelCase } from "../../../../utils/resource-naming";

export interface ScannedScalarFieldParams {
    readonly fieldName: string;
    readonly propertyName: string;
    readonly rules: readonly ValidationRuleNode[];
}

export class ScannedScalarFieldNode {
    public readonly kind = "scalar" as const;
    public readonly fieldName: string;
    public readonly propertyName: string;
    public readonly rules: readonly ValidationRuleNode[];

    constructor(params: ScannedScalarFieldParams) {
        this.fieldName = params.fieldName;
        this.propertyName = params.propertyName;
        this.rules = Object.freeze([...params.rules]);
        Object.freeze(this);
    }

    public static create(
        fieldName: string,
        rules: readonly ValidationRuleNode[] = [],
        propertyName: string = toCamelCase(fieldName)
    ): ScannedScalarFieldNode {
        return new ScannedScalarFieldNode({
            fieldName,
            propertyName,
            rules
        });
    }
}

export interface ScannedObjectFieldParams {
    readonly fieldName: string;
    readonly propertyName: string;
    readonly fields: readonly ValidationFieldNode[];
}

export class ScannedObjectFieldNode {
    public readonly kind = "object" as const;
    public readonly fieldName: string;
    public readonly propertyName: string;
    public readonly fields: readonly ValidationFieldNode[];

    constructor(params: ScannedObjectFieldParams) {
        this.fieldName = params.fieldName;
        this.propertyName = params.propertyName;
        this.fields = Object.freeze([...params.fields]);
        Object.freeze(this);
    }

    public static create(
        fieldName: string,
        fields: readonly ValidationFieldNode[] = [],
        propertyName: string = toCamelCase(fieldName)
    ): ScannedObjectFieldNode {
        return new ScannedObjectFieldNode({
            fieldName,
            propertyName,
            fields
        });
    }
}

export interface ScannedArrayFieldParams {
    readonly fieldName: string;
    readonly propertyName: string;
    readonly rules: readonly ValidationRuleNode[];
    readonly element: ValidationFieldNode;
}

export class ScannedArrayFieldNode {
    public readonly kind = "array" as const;
    public readonly fieldName: string;
    public readonly propertyName: string;
    public readonly rules: readonly ValidationRuleNode[];
    public readonly element: ValidationFieldNode;

    constructor(params: ScannedArrayFieldParams) {
        this.fieldName = params.fieldName;
        this.propertyName = params.propertyName;
        this.rules = Object.freeze([...params.rules]);
        this.element = params.element;
        Object.freeze(this);
    }

    public static create(
        fieldName: string,
        element: ValidationFieldNode,
        rules: readonly ValidationRuleNode[] = [],
        propertyName: string = toCamelCase(fieldName)
    ): ScannedArrayFieldNode {
        return new ScannedArrayFieldNode({
            fieldName,
            propertyName,
            rules,
            element
        });
    }
}
