/**
 * validationTreeBuilder.ts
 *
 * Builds nested ValidationFieldNode[] trees from flat validation rule entries.
 *
 * @module core/compiler/scanner/descriptors/validation
 */

import {
    RouteValidationRuleEntry,
    ValidationRuleNode,
    ValidationFieldNode
} from "../../../../types/route";
import { toCamelCase } from "../../../../utils/resource-naming";
import {
    ScannedScalarFieldNode,
    ScannedObjectFieldNode,
    ScannedArrayFieldNode
} from "./fieldNodes";

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
