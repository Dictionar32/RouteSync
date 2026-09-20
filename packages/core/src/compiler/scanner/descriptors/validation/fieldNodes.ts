/** Semantic validation tree nodes produced at the scanner boundary. */
import type { ValidationRuleNode, ValidationFieldNode } from "../../../../types/route";
import type { SemanticType } from "../../../types/SemanticType";
import type { RequestFieldPresence } from "../../../../types/domain/requestFieldPresence";
import { toCamelCase } from "../../../../utils/resource-naming";

export interface ScannedScalarFieldParams {
    readonly fieldName: string;
    readonly propertyName: string;
    readonly semanticType: SemanticType;
    readonly presence: RequestFieldPresence;
    readonly rules: readonly ValidationRuleNode[];
}

export class ScannedScalarFieldNode {
    public readonly kind = "scalar" as const;
    public readonly fieldName: string;
    public readonly propertyName: string;
    public readonly semanticType: SemanticType;
    public readonly presence: RequestFieldPresence;
    public readonly rules: readonly ValidationRuleNode[];

    constructor(params: ScannedScalarFieldParams) {
        this.fieldName = params.fieldName;
        this.propertyName = params.propertyName;
        this.semanticType = params.semanticType;
        this.presence = params.presence;
        this.rules = Object.freeze([...params.rules]);
        Object.freeze(this);
    }

    public static create(
        fieldName: string,
        semanticType: SemanticType,
        presence: RequestFieldPresence,
        rules: readonly ValidationRuleNode[] = [],
        propertyName: string = toCamelCase(fieldName)
    ): ScannedScalarFieldNode {
        return new ScannedScalarFieldNode({ fieldName, propertyName, semanticType, presence, rules });
    }
}

export interface ScannedObjectFieldParams {
    readonly fieldName: string;
    readonly propertyName: string;
    readonly semanticType: SemanticType;
    readonly presence: RequestFieldPresence;
    readonly fields: readonly ValidationFieldNode[];
}

export class ScannedObjectFieldNode {
    public readonly kind = "object" as const;
    public readonly fieldName: string;
    public readonly propertyName: string;
    public readonly semanticType: SemanticType;
    public readonly presence: RequestFieldPresence;
    public readonly fields: readonly ValidationFieldNode[];

    constructor(params: ScannedObjectFieldParams) {
        this.fieldName = params.fieldName;
        this.propertyName = params.propertyName;
        this.semanticType = params.semanticType;
        this.presence = params.presence;
        this.fields = Object.freeze([...params.fields]);
        Object.freeze(this);
    }

    public static create(
        fieldName: string,
        semanticType: SemanticType,
        presence: RequestFieldPresence,
        fields: readonly ValidationFieldNode[] = [],
        propertyName: string = toCamelCase(fieldName)
    ): ScannedObjectFieldNode {
        return new ScannedObjectFieldNode({ fieldName, propertyName, semanticType, presence, fields });
    }
}

export interface ScannedArrayFieldParams {
    readonly fieldName: string;
    readonly propertyName: string;
    readonly semanticType: SemanticType;
    readonly presence: RequestFieldPresence;
    readonly rules: readonly ValidationRuleNode[];
    readonly element: ValidationFieldNode;
}

export class ScannedArrayFieldNode {
    public readonly kind = "array" as const;
    public readonly fieldName: string;
    public readonly propertyName: string;
    public readonly semanticType: SemanticType;
    public readonly presence: RequestFieldPresence;
    public readonly rules: readonly ValidationRuleNode[];
    public readonly element: ValidationFieldNode;

    constructor(params: ScannedArrayFieldParams) {
        this.fieldName = params.fieldName;
        this.propertyName = params.propertyName;
        this.semanticType = params.semanticType;
        this.presence = params.presence;
        this.rules = Object.freeze([...params.rules]);
        this.element = params.element;
        Object.freeze(this);
    }

    public static create(
        fieldName: string,
        semanticType: SemanticType,
        presence: RequestFieldPresence,
        element: ValidationFieldNode,
        rules: readonly ValidationRuleNode[] = [],
        propertyName: string = toCamelCase(fieldName)
    ): ScannedArrayFieldNode {
        return new ScannedArrayFieldNode({ fieldName, propertyName, semanticType, presence, rules, element });
    }
}
