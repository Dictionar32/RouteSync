/**
 * validationRuleChecker.ts
 *
 * Checks validation rules for explicit semantic type declarations.
 *
 * @module core/compiler/scanner/subscanners/validationRuleChecker
 */

/**
 * Checks whether a validation rule string declares an explicit data type.
 */
export function hasExplicitValidationType(ruleStr: string): boolean {
    const s = ruleStr.toLowerCase();
    return (
        s.includes('string') ||
        s.includes('integer') ||
        s.includes('int') ||
        s.includes('numeric') ||
        s.includes('boolean') ||
        s.includes('bool') ||
        s.includes('array') ||
        s.includes('file') ||
        s.includes('image') ||
        s.includes('email') ||
        s.includes('url') ||
        s.includes('uuid') ||
        s.includes('ip') ||
        s.includes('json') ||
        s.includes('date') ||
        s.includes('in:') ||
        s.includes('digits') ||
        s.includes('alpha') ||
        s.includes('accepted') ||
        s.includes('declined') ||
        s.includes('confirmed')
    );
}

/**
 * Emits a compiler warning if a field or wildcard lacks explicit typing.
 */
export function warnIfTypeNotExplicit(
    key: string,
    ruleStr: string,
    routePath: string,
    routeActionDesc: string
): void {
    if (!hasExplicitValidationType(ruleStr)) {
        if (key.includes('.*')) {
            console.warn(`[RouteSync Compiler Warning] Tipe elemen untuk wildcard '${key}' pada route ${routePath} (${routeActionDesc}) belum eksplisit.`);
        } else {
            console.warn(`[RouteSync Compiler Warning] Tipe field untuk '${key}' pada route ${routePath} (${routeActionDesc}) belum eksplisit.`);
        }
    }
}
