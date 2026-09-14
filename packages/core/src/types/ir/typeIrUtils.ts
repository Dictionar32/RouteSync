/**
 * typeIrUtils.ts
 *
 * Safe utility functions for TypeIR manipulation and unwrapping.
 * Conforms to Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/typeIrUtils
 */

import type {
    TypeIR,
    PrimitiveTypeIR,
    ReferenceTypeIR,
    ArrayTypeIR,
    NullableTypeIR,
    OptionalTypeIR
} from './typeIrTypes';

export class TypeIRUtils {
    static makeNullable(inner: TypeIR): NullableTypeIR {
        return Object.freeze({ kind: 'nullable', inner });
    }

    static makeOptional(inner: TypeIR): OptionalTypeIR {
        return Object.freeze({ kind: 'optional', inner });
    }

    static makeArray(items: TypeIR, options?: { minItems?: number; maxItems?: number }): ArrayTypeIR {
        return Object.freeze({
            kind: 'array',
            items,
            ...(options?.minItems !== undefined ? { minItems: options.minItems } : {}),
            ...(options?.maxItems !== undefined ? { maxItems: options.maxItems } : {})
        });
    }

    static isPrimitive(type: TypeIR): type is PrimitiveTypeIR {
        return type.kind === 'primitive';
    }

    static isReference(type: TypeIR): type is ReferenceTypeIR {
        return type.kind === 'reference';
    }

    static isArray(type: TypeIR): type is ArrayTypeIR {
        return type.kind === 'array';
    }

    static isNullable(type: TypeIR): type is NullableTypeIR {
        return type.kind === 'nullable';
    }

    static isOptional(type: TypeIR): type is OptionalTypeIR {
        return type.kind === 'optional';
    }

    static unwrapType(type: TypeIR): TypeIR {
        return (type.kind === 'nullable' || type.kind === 'optional') ? this.unwrapType(type.inner) : type;
    }

    static isDeepNullable(type: TypeIR): boolean {
        if (type.kind === 'nullable') return true;
        if (type.kind === 'optional') return this.isDeepNullable(type.inner);
        return false;
    }

    static isDeepOptional(type: TypeIR): boolean {
        if (type.kind === 'optional') return true;
        if (type.kind === 'nullable') return this.isDeepOptional(type.inner);
        return false;
    }

    static describeType(type: TypeIR): string {
        switch (type.kind) {
            case 'primitive': return `primitive(${type.type}${type.format ? `:${type.format}` : ''})`;
            case 'reference': return `reference(${type.target}${type.module ? `@${type.module}` : ''})`;
            case 'array': return `array<${this.describeType(type.items)}>`;
            case 'nullable': return `${this.describeType(type.inner)} | null`;
            case 'optional': return `${this.describeType(type.inner)}?`;
            case 'union': return `union(${type.types.map(t => this.describeType(t)).join(' | ')})`;
            case 'literal': return `literal(${JSON.stringify(type.value)})`;
            case 'inline_object': {
                const props = Object.entries(type.properties).map(([k, v]) => `${k}: ${this.describeType(v)}`).join(', ');
                return `{ ${props} }`;
            }
            default: return 'unknown';
        }
    }

    static migrateFromLegacy(_legacyType: unknown, _context: string): TypeIR {
        return Object.freeze({ kind: 'primitive', type: 'unknown' });
    }
}
