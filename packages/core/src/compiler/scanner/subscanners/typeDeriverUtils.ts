import { relationNormalizeWhitespace, relationAny, relationEqual } from '../../../semantic/foundation/semanticRelations';
import { relationFirstOption, relationOptionFold } from '../../../semantic/foundation/relationalSequence';
/**
 * typeDeriverUtils.ts
 *
 * Centralized Domain Utilities: TypeDeriver Subsystem.
 * Eliminates repetitive string heuristics and unifies domain name resolution.
 *
 * @module core/compiler/scanner/subscanners/typeDeriverUtils
 */

import { RouteSemanticFlow } from "../../../types/route";
import { PrimitiveKind } from "../../types/SemanticType";
import type { DomainTypeName, ResourceName, ControllerName, RoutePath, ActionName, RouteName } from "../../../types/upstream/names";

/**
 * Authoritative inference of PrimitiveKind from raw type strings or descriptors.
 * Eliminates duplicated .includes('int') / .includes('decimal') checking across the compiler.
 */
export function resolvePrimitiveKind(
    rawType: unknown,
    fallback: PrimitiveKind = PrimitiveKind.STRING
): PrimitiveKind {
    const present = relationFirstOption(
        [rawType],
        value => !['[object Undefined]', '[object Null]'].includes(Object.prototype.toString.call(value)),
    );

    return relationOptionFold(
        present,
        () => fallback,
        value => resolvePrimitiveKindFromText(relationNormalizeWhitespace(String(value)).toLowerCase(), fallback),
    );
}

const resolvePrimitiveKindFromText = (
    typeStr: string,
    fallback: PrimitiveKind,
): PrimitiveKind => {
    const candidates: readonly { readonly matches: boolean; readonly kind: PrimitiveKind }[] = [
        { matches: relationEqual(typeStr, 'unknown'), kind: PrimitiveKind.INDETERMINATE },
        {
            matches: relationAny([
                ['number', 'int', 'integer', 'float', 'double', 'real'].includes(typeStr),
                ['int', 'decimal', 'float', 'numeric', 'digits'].some(fragment => typeStr.includes(fragment)),
            ]),
            kind: PrimitiveKind.NUMBER,
        },
        {
            matches: relationAny([
                ['boolean', 'bool'].includes(typeStr),
                ['accepted', 'declined'].some(fragment => typeStr.includes(fragment)),
            ]),
            kind: PrimitiveKind.BOOLEAN,
        },
        { matches: ['datetime', 'date', 'timestamp'].includes(typeStr), kind: PrimitiveKind.DATETIME },
        { matches: ['file', 'image'].includes(typeStr), kind: PrimitiveKind.FILE },
    ];

    return relationOptionFold(
        relationFirstOption(candidates, candidate => candidate.matches),
        () => fallback,
        candidate => candidate.kind,
    );
};

export type RouteDomainInput = {
    readonly domain: DomainTypeName;
    readonly resourceName: ResourceName;
    readonly controllerName: ControllerName;
    readonly path: RoutePath;
    readonly actionName: ActionName;
    readonly name: RouteName;
};

/**
 * Authoritative resolution of resource/domain name within a route.
 * Canonical SSOT is pre-resolved on route.domain at Origin Boundary.
 */
export function resolveRouteDomain(route: RouteDomainInput): DomainTypeName {
    return route.domain;
}

