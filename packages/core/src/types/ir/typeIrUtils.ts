/** Closed TypeIR operations. */

import type {
    TypeIR,
    PrimitiveTypeIR,
    ReferenceTypeIR,
    ArrayTypeIR,
    NullableTypeIR,
    OptionalTypeIR,
} from './typeIrTypes';

export class TypeIRUtils {
    static makeNullable(inner: TypeIR): NullableTypeIR {
        return Object.freeze({ kind: 'nullable', inner });
    }

    static makeOptional(inner: TypeIR): OptionalTypeIR {
        return Object.freeze({ kind: 'optional', inner });
    }

    static makeArray(items: TypeIR): ArrayTypeIR {
        return Object.freeze({ kind: 'array', items });
    }

    static isPrimitive(type: TypeIR): type is PrimitiveTypeIR { return type.kind === 'primitive'; }
    static isReference(type: TypeIR): type is ReferenceTypeIR { return type.kind === 'reference'; }
    static isArray(type: TypeIR): type is ArrayTypeIR { return type.kind === 'array'; }
    static isNullable(type: TypeIR): type is NullableTypeIR { return type.kind === 'nullable'; }
    static isOptional(type: TypeIR): type is OptionalTypeIR { return type.kind === 'optional'; }

    static unwrapType(type: TypeIR): TypeIR {
        return type.kind === 'nullable' || type.kind === 'optional'
            ? this.unwrapType(type.inner)
            : type;
    }

    static isDeepNullable(type: TypeIR): boolean {
        return type.kind === 'nullable' || (type.kind === 'optional' && this.isDeepNullable(type.inner));
    }

    static isDeepOptional(type: TypeIR): boolean {
        return type.kind === 'optional' || (type.kind === 'nullable' && this.isDeepOptional(type.inner));
    }

    static describeType(type: TypeIR): string {
        const descriptions = {
            primitive: (value: PrimitiveTypeIR) => `primitive(${value.type})`,
            reference: (value: ReferenceTypeIR) => `reference(${value.target})`,
            array: (value: ArrayTypeIR) => `array<${this.describeType(value.items)}>`,
            json: () => 'json',
            never: () => 'never',
            error: value => `error(${value.diagnostic})`,
            intersection: value => `intersection(${value.types.map(item => this.describeType(item)).join(' & ')})`,
            collection: value => `collection<${this.describeType(value.element)}>`,
            generic: value => `generic(${this.describeType(value.base)}<${value.parameters.map(item => this.describeType(item.type)).join(', ')}>)`,
            nullable: value => `${this.describeType(value.inner)} | null`,
            optional: value => `${this.describeType(value.inner)}?`,
            union: value => `union(${value.types.map(item => this.describeType(item)).join(' | ')})`,
            literal: value => `literal(${JSON.stringify(value.value)})`,
            inline_object: value => `{ ${value.properties.map(property => `${property.name}: ${this.describeType(property.type)}`).join(', ')} }`,
        } satisfies { [K in TypeIR['kind']]: (value: Extract<TypeIR, { kind: K }>) => string };
        return descriptions[type.kind](type as never);
    }
}
