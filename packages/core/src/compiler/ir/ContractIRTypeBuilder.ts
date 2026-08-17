/**
 * Phase 4A — Structured Contract IR type builder.
 *
 * The builder uses one discriminated-union switch. No scattered type guards
 * are required because each semantic variant has its own required payload.
 */

import type { ResolvedSemanticType } from '../types/ResolvedSemanticType';
import {
    arrayType,
    inlineObjectType,
    literalType,
    primitiveType,
    referenceType,
    unionType,
    type TypeIR,
} from '../types/TypeIR';

export class ContractIRTypeBuilder {
    public buildType(type: ResolvedSemanticType): TypeIR {
        switch (type.kind) {
            case 'primitive':
                return primitiveType(type.type, type.format);

            case 'resource':
                return type.collection
                    ? arrayType(referenceType(type.resource))
                    : referenceType(type.resource);

            case 'model':
                return referenceType(type.model);

            case 'object':
                return inlineObjectType(
                    Object.fromEntries(
                        Object.entries(type.properties).map(
                            ([name, property]) => [
                                name,
                                this.buildType(property),
                            ],
                        ),
                    ),
                );

            case 'array':
                return arrayType(this.buildType(type.items));

            case 'union':
                return unionType(
                    this.buildType(type.types[0]),
                    this.buildType(type.types[1]),
                    ...type.types
                        .slice(2)
                        .map((item) => this.buildType(item)),
                );

            case 'literal':
                return literalType(type.value);
        }
    }
}
