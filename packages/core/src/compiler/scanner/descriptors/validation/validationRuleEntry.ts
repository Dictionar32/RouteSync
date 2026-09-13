/**
 * validationRuleEntry.ts
 *
 * Scanned Route Validation Rule Entry descriptor and factory.
 *
 * @module core/compiler/scanner/descriptors/validation
 */

import {
    RouteValidationRuleEntry,
    ValidationRuleNode,
    ValidationRuleParser
} from "../../../../types/route";
import { toCamelCase } from "../../../../utils/resource-naming";

export interface ScannedRouteValidationRuleParams {
    readonly fieldName: string;
    readonly propertyName: string;
    readonly rules: readonly string[];
    readonly ast: readonly ValidationRuleNode[];
}

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
