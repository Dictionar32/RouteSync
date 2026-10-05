/** Closed semantic lowering for nested object response fields. */

import { relationOptionFold, relationProject, relationResolve } from '../../../semantic/foundation/relationalSequence';
import { matchResponseFieldProjection, type ResponseFieldProjection } from './response-field';
import { ZodModifierBuilder } from './ZodModifierBuilder';

export class NestedObjectSchemaBuilder {
    constructor(private readonly zodModifierBuilder: ZodModifierBuilder) {}

    buildObjectSchema(field: ResponseFieldProjection, inline = false): string {
        const baseSchema = relationResolve(
            field.fields.length > 0,
            () => {
                const properties = relationProject(field.fields, childField => `${childField.name}: ${this.buildFieldSchema(childField, inline)}`);
                return inline
                    ? `z.object({ ${properties.join(', ')} })`
                    : `z.object({\n  ${properties.join(',\n  ')}\n})`;
            },
            () => 'z.object({})',
        );
        return this.applyModifiers(baseSchema, field);
    }

    private buildFieldSchema(field: ResponseFieldProjection, inline = false): string {
        return matchResponseFieldProjection(field, {
            primitive: value => this.buildPrimitiveSchema(value),
            object: value => this.buildObjectSchema(value, inline),
            array: value => this.buildBasicArraySchema(value),
        });
    }

    private buildPrimitiveSchema(field: ResponseFieldProjection): string {
        const zodTypeMap: Readonly<Record<string, string>> = Object.freeze({
            string: 'z.string()',
            number: 'z.number()',
            boolean: 'z.boolean()',
            datetime: 'z.string().datetime()',
            unknown: 'z.unknown()'
        });
        const zodType = relationResolve(
            Object.prototype.hasOwnProperty.call(zodTypeMap, field.type),
            () => zodTypeMap[field.type],
            () => 'z.unknown()',
        );
        return this.applyModifiers(zodType, field);
    }

    private buildBasicArraySchema(field: ResponseFieldProjection): string {
        const itemSchema = relationOptionFold(
            field.itemType,
            () => 'z.unknown()',
            item => this.buildFieldSchema(item),
        );
        return this.applyModifiers(`z.array(${itemSchema})`, field);
    }

    private applyModifiers(schema: string, field: ResponseFieldProjection): string {
        return schema + this.zodModifierBuilder.buildModifiers({
            required: !field.optional,
            nullable: field.nullable
        });
    }
}
