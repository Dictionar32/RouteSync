/**
 * Phase 4D — Legacy -> Compiler boundary.
 *
 * Active Consumer: Orchestrator for legacy contract value resolution.
 *
 * @module compiler/compatibility
 */

import type { ResolvedSemanticType } from '../types/ResolvedSemanticType';
import { relationResolve, relationProject } from '../../semantic/kernel/relationalSequence';
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

type LegacyVisitor<R> = {
    readonly [K in LegacyContractValue['kind']]: (value: Extract<LegacyContractValue, { readonly kind: K }>) => R;
};

const visitLegacyContractValue = <R>(value: LegacyContractValue, visitor: LegacyVisitor<R>): R => visitor[value.kind](value);

export const ContractInputBoundary = Object.freeze({
    resolve(value: LegacyContractValue): ResolvedSemanticType {
        return visitLegacyContractValue(value, {
            primitive: current => ({
                kind: 'primitive',
                type: resolveLegacyPrimitive(current.type),
                ...relationResolve(Object.hasOwn(current, 'format'), () => ({ format: current.format }), () => ({})),
            }),
            resource: current => ({ kind: 'resource', resource: current.resource, collection: current.collection }),
            model: current => ({ kind: 'model', model: current.model }),
            object: current => ({
                kind: 'object',
                properties: Object.fromEntries(relationProject(Object.entries(current.properties), ([name, property]) => [name, ContractInputBoundary.resolve(property)])),
            }),
            array: current => ({ kind: 'array', items: ContractInputBoundary.resolve(current.items) }),
            union: current => resolveLegacyUnion(current.types, item => ContractInputBoundary.resolve(item)),
            literal: current => ({ kind: 'literal', value: current.value }),
        });
    },
});
