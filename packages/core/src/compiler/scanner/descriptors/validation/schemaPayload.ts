/**
 * schemaPayload.ts
 *
 * Scanned Route Schema Payload descriptor and semantic factories.
 *
 * @module core/compiler/scanner/descriptors/validation
 */

import {
    RouteSchemaPayload,
    RouteMessageEntry,
    RouteAttributeEntry
} from "../../../../types/route";
import type { RequestField } from "../../../../types/domain/request";

export interface ScannedRouteSchemaParams {
    readonly fields: readonly RequestField[];
    readonly messages: readonly RouteMessageEntry[];
    readonly attributes: readonly RouteAttributeEntry[];
}

export class ScannedRouteSchemaPayload implements RouteSchemaPayload {
    public readonly fields: readonly RequestField[];
    public readonly messages: readonly RouteMessageEntry[];
    public readonly attributes: readonly RouteAttributeEntry[];

    constructor({ fields, messages, attributes }: ScannedRouteSchemaParams) {
        this.fields = Object.freeze([...fields]);
        this.messages = Object.freeze([...messages]);
        this.attributes = Object.freeze([...attributes]);
        Object.freeze(this);
    }

    public static empty(): ScannedRouteSchemaPayload {
        return new ScannedRouteSchemaPayload({
            fields: [],
            messages: [],
            attributes: []
        });
    }

    public static fromFields(
        fields: readonly RequestField[],
        messages: readonly RouteMessageEntry[] = [],
        attributes: readonly RouteAttributeEntry[] = []
    ): ScannedRouteSchemaPayload {
        return new ScannedRouteSchemaPayload({
            fields,
            messages,
            attributes
        });
    }
}