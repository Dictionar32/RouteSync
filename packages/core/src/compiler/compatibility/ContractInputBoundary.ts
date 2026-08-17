/**
 * Phase 4D — Legacy -> Compiler boundary.
 *
 * The new compiler owns the semantic contract. Legacy engines are treated as
 * external inputs and must provide enough information to construct one of the
 * compiler's closed ResolvedSemanticType variants.
 *
 * This boundary deliberately does not invent missing semantic facts.
 */
import type {
    ResolvedPrimitive,
    ResolvedSemanticType,
} from '../types/ResolvedSemanticType';
import type { SemanticType } from '../../types/semantic';

export interface LegacyPrimitiveValue {
    readonly kind: 'primitive';
    readonly type: SemanticType;
    readonly format?: string;
}

export interface LegacyResourceValue {
    readonly kind: 'resource';
    readonly resource: string;
    readonly collection: boolean;
}

export interface LegacyModelValue {
    readonly kind: 'model';
    readonly model: string;
}

export interface LegacyObjectValue {
    readonly kind: 'object';
    readonly properties: Readonly<Record<string, LegacyContractValue>>;
}

export interface LegacyArrayValue {
    readonly kind: 'array';
    readonly items: LegacyContractValue;
}

export interface LegacyUnionValue {
    readonly kind: 'union';
    readonly types: readonly LegacyContractValue[];
}

export interface LegacyLiteralValue {
    readonly kind: 'literal';
    readonly value: string | number | boolean;
}

export type LegacyContractValue =
    | LegacyPrimitiveValue
    | LegacyResourceValue
    | LegacyModelValue
    | LegacyObjectValue
    | LegacyArrayValue
    | LegacyUnionValue
    | LegacyLiteralValue;

export class ContractInputBoundaryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ContractInputBoundaryError';
    }
}

export class ContractInputBoundary {
    public resolve(value: LegacyContractValue): ResolvedSemanticType {
        switch (value.kind) {
            case 'primitive':
                return {
                    kind: 'primitive',
                    type: this.resolvePrimitive(value.type),
                    ...(value.format === undefined ? {} : { format: value.format }),
                };

            case 'resource':
                return {
                    kind: 'resource',
                    resource: value.resource,
                    collection: value.collection,
                };

            case 'model':
                return {
                    kind: 'model',
                    model: value.model,
                };

            case 'object':
                return {
                    kind: 'object',
                    properties: Object.fromEntries(
                        Object.entries(value.properties).map(([name, property]) => [
                            name,
                            this.resolve(property),
                        ]),
                    ),
                };

            case 'array':
                return {
                    kind: 'array',
                    items: this.resolve(value.items),
                };

            case 'union':
                return this.resolveUnion(value.types);

            case 'literal':
                return {
                    kind: 'literal',
                    value: value.value,
                };
        }
    }

    private resolvePrimitive(value: SemanticType): ResolvedPrimitive {
        switch (value) {
            case 'string':
                return 'string';

            case 'number':
                return 'number';

            case 'boolean':
                return 'boolean';

            case 'datetime':
                return 'datetime';

            case 'unknown':
                return 'unknown';

            default:
                throw new ContractInputBoundaryError(
                    `Semantic type "${value}" cannot be represented as a compiler primitive.`,
                );
        }
    }

    private resolveUnion(
        values: readonly LegacyContractValue[],
    ): Extract<ResolvedSemanticType, { kind: 'union' }> {
        if (values.length < 2) {
            throw new ContractInputBoundaryError(
                'A legacy union must contain at least two members.',
            );
        }

        const [first, second, ...rest] = values;

        return {
            kind: 'union',
            types: [
                this.resolve(first),
                this.resolve(second),
                ...rest.map((value) => this.resolve(value)),
            ],
        };
    }
}