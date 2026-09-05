/**
 * validationDescriptors.ts
 *
 * AST descriptors for Route validation rules, payloads, and tree builder.
 *
 * @module core/compiler/scanner/descriptors/validationDescriptors
 */

import {
    RouteValidationRuleEntry,
    RouteSchemaPayload,
    RouteMessageEntry,
    RouteAttributeEntry,
    ValidationRuleNode,
    ValidationRuleParser,
    ValidationFieldNode
} from "../../../types/route";
import { toCamelCase } from "../../../utils/resource-naming";

export interface ScannedRouteValidationRuleParams {
    readonly fieldName: string;
    readonly propertyName: string;
    readonly rules: readonly string[];
    readonly ast: readonly ValidationRuleNode[];
}

/**
 * Reusable Constructor: Scanned Route Validation Rule Entry.
 */
export class ScannedRouteValidationRuleEntry implements RouteValidationRuleEntry {
    public readonly fieldName: string;
    public readonly propertyName: string;
    public readonly rules: readonly string[];
    public readonly ast: readonly ValidationRuleNode[];

    constructor({ fieldName, propertyName, rules, ast }: ScannedRouteValidationRuleParams) {
        this.fieldName = fieldName;
        this.propertyName = propertyName;
        this.rules = Object.freeze([...rules]);
        this.ast = Object.freeze([...ast]);
        Object.freeze(this);
    }

    public static create(
        fieldName: string,
        rules: readonly string[],
        propertyName: string = toCamelCase(fieldName),
        ast?: readonly ValidationRuleNode[]
    ): ScannedRouteValidationRuleEntry {
        return new ScannedRouteValidationRuleEntry({
            fieldName,
            propertyName,
            rules,
            ast: ast ? Object.freeze([...ast]) : ValidationRuleParser.parseAll(rules)
        });
    }
}

export interface ScannedRouteSchemaParams {
    readonly rules: readonly RouteValidationRuleEntry[];
    readonly messages: readonly RouteMessageEntry[];
    readonly attributes: readonly RouteAttributeEntry[];
}

/**
 * Reusable Constructor: Scanned Route Schema Payload.
 */
export class ScannedRouteSchemaPayload implements RouteSchemaPayload {
    public readonly rules: readonly RouteValidationRuleEntry[];
    public readonly messages: readonly RouteMessageEntry[];
    public readonly attributes: readonly RouteAttributeEntry[];

    constructor({ rules, messages, attributes }: ScannedRouteSchemaParams) {
        this.rules = Object.freeze([...rules]);
        this.messages = Object.freeze([...messages]);
        this.attributes = Object.freeze([...attributes]);
        Object.freeze(this);
    }

    public static empty(): ScannedRouteSchemaPayload {
        return new ScannedRouteSchemaPayload({
            rules: [],
            messages: [],
            attributes: []
        });
    }

    public static fromRules(
        rules: readonly RouteValidationRuleEntry[],
        messages: readonly RouteMessageEntry[] = [],
        attributes: readonly RouteAttributeEntry[] = []
    ): ScannedRouteSchemaPayload {
        return new ScannedRouteSchemaPayload({
            rules,
            messages,
            attributes
        });
    }
}

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

export class ValidationTreeBuilder {
    public static buildTree(rules: readonly RouteValidationRuleEntry[]): readonly ValidationFieldNode[] {
        const rootFields: Map<string, ValidationFieldNode> = new Map();

        for (const entry of rules) {
            const ruleNodes: readonly ValidationRuleNode[] = entry.ast ?? [];
            if (entry.fieldName.includes(".*.")) {
                const parts = entry.fieldName.split(".*.");
                const parentName = parts[0];
                const childName = parts[1];
                const parentProp = toCamelCase(parentName);
                const childProp = toCamelCase(childName);

                let existing = rootFields.get(parentName);
                if (!existing || existing.kind !== "array") {
                    const scalarChild = new ScannedScalarFieldNode({
                        fieldName: childName,
                        propertyName: childProp,
                        rules: ruleNodes
                    });
                    const objectElement = new ScannedObjectFieldNode({
                        fieldName: parentName,
                        propertyName: parentProp,
                        fields: [scalarChild]
                    });
                    const arrayNode = new ScannedArrayFieldNode({
                        fieldName: parentName,
                        propertyName: parentProp,
                        rules: [],
                        element: objectElement
                    });
                    rootFields.set(parentName, arrayNode);
                } else if (existing.element.kind === "object") {
                    const currentFields = [...existing.element.fields];
                    currentFields.push(new ScannedScalarFieldNode({
                        fieldName: childName,
                        propertyName: childProp,
                        rules: ruleNodes
                    }));
                    rootFields.set(parentName, new ScannedArrayFieldNode({
                        fieldName: parentName,
                        propertyName: parentProp,
                        rules: existing.rules,
                        element: new ScannedObjectFieldNode({
                            fieldName: parentName,
                            propertyName: parentProp,
                            fields: currentFields
                        })
                    }));
                }
            } else {
                rootFields.set(entry.fieldName, new ScannedScalarFieldNode({
                    fieldName: entry.fieldName,
                    propertyName: toCamelCase(entry.fieldName),
                    rules: ruleNodes
                }));
            }
        }

        return Object.freeze(Array.from(rootFields.values()));
    }
}
