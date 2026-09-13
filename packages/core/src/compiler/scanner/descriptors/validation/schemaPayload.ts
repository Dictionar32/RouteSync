/**
 * schemaPayload.ts
 *
 * Scanned Route Schema Payload descriptor and semantic factories.
 *
 * @module core/compiler/scanner/descriptors/validation
 */

import {
    RouteValidationRuleEntry,
    RouteSchemaPayload,
    RouteMessageEntry,
    RouteAttributeEntry
} from "../../../../types/route";

export interface ScannedRouteSchemaParams {
    readonly rules: readonly RouteValidationRuleEntry[];
    readonly messages: readonly RouteMessageEntry[];
    readonly attributes: readonly RouteAttributeEntry[];
}

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
