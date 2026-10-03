/** Closed semantic lowering for array response fields. */

import { relationOptionFold, relationResolve } from '../../../semantic/kernel/relationalSequence';
import { matchResponseFieldProjection, type ResponseFieldProjection } from './response-field';
import { NestedObjectSchemaBuilder } from './NestedObjectSchemaBuilder';
import { ZodModifierBuilder } from './ZodModifierBuilder';

export class ArraySchemaBuilder {
    constructor(
        private readonly nestedObjectBuilder: NestedObjectSchemaBuilder,
        private readonly zodModifierBuilder: ZodModifierBuilder
    ) {}

    buildArraySchema(field: ResponseFieldProjection): string {
        const itemSchema = relationOptionFold(
            field.itemType,
            () => { throw Error(`Array field '${field.name}' missing itemType`); },
            item => this.buildItemSchema(item),
        );
        return this.applyModifiers(`z.array(${itemSchema})`, field);
    }

    private buildItemSchema(itemType: ResponseFieldProjection): string {
        return matchResponseFieldProjection(itemType, {
            primitive: value => this.buildPrimitiveItemSchema(value),
            object: value => this.nestedObjectBuilder.buildObjectSchema(value, true),
            array: value => this.buildArraySchema(value),
        });
    }

    private buildPrimitiveItemSchema(itemType: ResponseFieldProjection): string {
        const zodTypeMap: Readonly<Record<string, string>> = Object.freeze({
            string: 'z.string()',
            number: 'z.number()',
            boolean: 'z.boolean()',
            datetime: 'z.string().datetime()',
            unknown: 'z.unknown()'
        });
        const baseSchema = relationResolve(
            Object.prototype.hasOwnProperty.call(zodTypeMap, itemType.type),
            () => zodTypeMap[itemType.type],
            () => 'z.unknown()',
        );
        const modifiers = this.zodModifierBuilder.buildModifiers({
            required: !itemType.optional,
            nullable: itemType.nullable
        });
        return baseSchema + modifiers;
    }

    private applyModifiers(schema: string, field: ResponseFieldProjection): string {
        return schema + this.zodModifierBuilder.buildModifiers({
            required: !field.optional,
            nullable: field.nullable
        });
    }
}
