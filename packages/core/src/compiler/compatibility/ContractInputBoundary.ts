/**
 * Phase 4D — Legacy -> Compiler boundary.
 *
 * Active Consumer: Orchestrator for legacy contract value resolution.
 *
 * @module compiler/compatibility
 */

import type { ResolvedSemanticType } from '../types/ResolvedSemanticType';
import {
    type LegacyPrimitiveValue,
    type LegacyResourceValue,
    type LegacyModelValue,
    type LegacyObjectValue,
    type LegacyArrayValue,
    type LegacyUnionValue,
    type LegacyLiteralValue,
    type LegacyContractValue,
    ContractInputBoundaryError,
    resolveLegacyPrimitive,
    resolveLegacyUnion
} from './boundary';

export {
    type LegacyPrimitiveValue,
    type LegacyResourceValue,
    type LegacyModelValue,
    type LegacyObjectValue,
    type LegacyArrayValue,
    type LegacyUnionValue,
    type LegacyLiteralValue,
    type LegacyContractValue,
    ContractInputBoundaryError
};

export class ContractInputBoundary {
    public resolve(value: LegacyContractValue): ResolvedSemanticType {
        switch (value.kind) {
            case 'primitive':
                return {
                    kind: 'primitive',
                    type: resolveLegacyPrimitive(value.type),
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
                    properties: Object.entries(value.properties).map(
                        ([name, property]) => ({
                            name,
                            type: this.resolve(property),
                        }),
                    ),
                };

            case 'array':
                return {
                    kind: 'array',
                    items: this.resolve(value.items),
                };

            case 'union':
                return resolveLegacyUnion(value.types, (v) => this.resolve(v));

            case 'literal':
                return {
                    kind: 'literal',
                    value: value.value,
                };
        }
    }
}
