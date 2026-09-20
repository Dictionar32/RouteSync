/** Semantic checker over already-resolved request field types. */
import type { SemanticType } from "../../types/SemanticType";

export function hasExplicitValidationType(type: SemanticType): boolean {
    return type.accept({
        primitive: value => value.type !== 'unknown',
        jsonValue: () => false,
        optional: value => hasExplicitValidationType(value.innerType),
        nullable: value => hasExplicitValidationType(value.innerType),
        never: () => false,
        error: () => false,
        union: () => false,
        intersection: () => false,
        generic: () => false,
        reference: () => true,
        readonlyCollection: value => hasExplicitValidationType(value.elementType),
        mutableCollection: value => hasExplicitValidationType(value.elementType),
        object: () => true
    });
}

export function warnIfTypeNotExplicit(
    key: string,
    type: SemanticType,
    routePath: string,
    routeActionDesc: string
): void {
    if (hasExplicitValidationType(type)) return;
    if (key.includes('.*')) {
        console.warn(`[RouteSync Compiler Warning] Tipe elemen untuk wildcard '${key}' pada route ${routePath} (${routeActionDesc}) belum eksplisit.`);
        return;
    }
    console.warn(`[RouteSync Compiler Warning] Tipe field untuk '${key}' pada route ${routePath} (${routeActionDesc}) belum eksplisit.`);
}
