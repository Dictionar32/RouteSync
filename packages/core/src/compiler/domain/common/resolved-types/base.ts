/**
 * base.ts
 *
 * Base class and primitive type representation for ResolvedSemanticType.
 *
 * @module compiler/domain/common/resolved-types/base
 */

import type { ResolvedSemanticType } from './catamorphism';
import type { ResolvedPrimitiveKind, ResolvedPrimitiveTypeParams } from './types';

export abstract class ResolvedSemanticTypeBase {
    abstract readonly kind: string;

    formatProperty(this: ResolvedSemanticType, name: string, lower: (t: ResolvedSemanticType) => string): string {
        return `${name}: ${lower(this)};`;
    }

    formatMapperAssignment(this: ResolvedSemanticType, name: string): string {
        return `  ${name}: api.${name},`;
    }

    formatChildArrayMapper(this: ResolvedSemanticType, name: string): string {
        return `  ${name}: api.${name},`;
    }
}

export class ResolvedPrimitiveType extends ResolvedSemanticTypeBase {
    readonly kind = 'primitive' as const;
    readonly primitiveKind: ResolvedPrimitiveKind;

    constructor({ primitiveKind }: ResolvedPrimitiveTypeParams) {
        super();
        this.primitiveKind = primitiveKind;
        Object.freeze(this);
    }

    public static string(): ResolvedPrimitiveType {
        return new ResolvedPrimitiveType({ primitiveKind: 'string' });
    }
    public static number(): ResolvedPrimitiveType {
        return new ResolvedPrimitiveType({ primitiveKind: 'number' });
    }
    public static boolean(): ResolvedPrimitiveType {
        return new ResolvedPrimitiveType({ primitiveKind: 'boolean' });
    }
    public static datetime(): ResolvedPrimitiveType {
        return new ResolvedPrimitiveType({ primitiveKind: 'datetime' });
    }
    public static file(): ResolvedPrimitiveType {
        return new ResolvedPrimitiveType({ primitiveKind: 'file' });
    }
    public static unknown(): ResolvedPrimitiveType {
        return new ResolvedPrimitiveType({ primitiveKind: 'unknown' });
    }
}
