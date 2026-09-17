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
import type { RequestField } from "../../../../types/domain/request";

export interface ScannedRouteSchemaParams {
    readonly fields: readonly RequestField[];
    readonly rules: readonly RouteValidationRuleEntry[];
    readonly messages: readonly RouteMessageEntry[];
    readonly attributes: readonly RouteAttributeEntry[];
}

export class ScannedRouteSchemaPayload implements RouteSchemaPayload {
    public readonly fields: readonly RequestField[];
    public readonly rules: readonly RouteValidationRuleEntry[];
    public readonly messages: readonly RouteMessageEntry[];
    public readonly attributes: readonly RouteAttributeEntry[];

    constructor({ fields, rules, messages, attributes }: ScannedRouteSchemaParams) {
        this.fields = Object.freeze([...fields]);
        this.rules = Object.freeze([...rules]);
        this.messages = Object.freeze([...messages]);
        this.attributes = Object.freeze([...attributes]);
        Object.freeze(this);
    }

    public static empty(): ScannedRouteSchemaPayload {
        return new ScannedRouteSchemaPayload({
            fields: [],
            rules: [],
            messages: [],
            attributes: []
        });
    }

    public static fromRules(
        rules: readonly RouteValidationRuleEntry[],
        messages: readonly RouteMessageEntry[] = [],
        attributes: readonly RouteAttributeEntry[] = [],
        fields: readonly RequestField[] = []
    ): ScannedRouteSchemaPayload {
        return new ScannedRouteSchemaPayload({
            fields,
            rules,
            messages,
            attributes
        });
    }
}