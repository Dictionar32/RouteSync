/**
 * ResponseSchemaMapper - Map route responses to Zod schemas
 * Active Consumer Orchestrator conforming to Rule 14.
 *
 * @module core/compiler/generators/contract-generation/ResponseSchemaMapper
 */

import type { ParsedResponseField } from './ResponseFieldParser';
import { NestedObjectSchemaBuilder } from './NestedObjectSchemaBuilder';
import { ArraySchemaBuilder } from './ArraySchemaBuilder';
import { ZodModifierBuilder } from './ZodModifierBuilder';
import {
    type ResponseTypeInfo,
    type RouteAction,
    type ActionResponseSchema,
    type ResourceResponseSchemas,
    buildObjectFromFields,
    mapActionResponseToSchema
} from './response-schema';

export {
    type ResponseTypeInfo,
    type RouteAction,
    type ActionResponseSchema,
    type ResourceResponseSchemas
};

export class ResponseSchemaMapper {
    private nestedObjectBuilder: NestedObjectSchemaBuilder;
    private arraySchemaBuilder: ArraySchemaBuilder;

    constructor() {
        const zodModifierBuilder = new ZodModifierBuilder();
        this.nestedObjectBuilder = new NestedObjectSchemaBuilder(zodModifierBuilder);
        this.arraySchemaBuilder = new ArraySchemaBuilder(this.nestedObjectBuilder, zodModifierBuilder);
    }

    public mapFieldsToZod(
        fields: ReadonlyArray<ParsedResponseField>,
        _resourceName: string,
        action: 'show' | 'index'
    ): string {
        let zodSchema = fields.length === 0
            ? 'z.object({})'
            : buildObjectFromFields(fields, this.nestedObjectBuilder, this.arraySchemaBuilder);

        if (action === 'index') {
            zodSchema = `z.array(${zodSchema})`;
        }

        return zodSchema;
    }

    public mapActionResponse(
        action: RouteAction,
        responseType: ResponseTypeInfo,
        resourceName: string
    ): ActionResponseSchema {
        return mapActionResponseToSchema(
            action,
            responseType,
            resourceName,
            this.nestedObjectBuilder,
            this.arraySchemaBuilder
        );
    }

    public mapResourceResponses(
        resourceName: string,
        actions: Record<RouteAction, ResponseTypeInfo | null>
    ): ResourceResponseSchemas {
        const schemas: ActionResponseSchema[] = [];

        for (const [action, responseType] of Object.entries(actions)) {
            if (responseType) {
                schemas.push(
                    this.mapActionResponse(
                        action as RouteAction,
                        responseType,
                        resourceName
                    )
                );
            }
        }

        return { resourceName, schemas };
    }
}
