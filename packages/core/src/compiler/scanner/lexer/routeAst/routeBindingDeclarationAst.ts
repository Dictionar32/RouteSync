import { expandRelation } from '../../../relational/sequence';
import { presenceOf, presenceFold } from '../../../../types/upstream/presence';
/** Syntax-level route-model binding facts extracted from a Laravel route URI. */
export interface RouteBindingDeclarationAst {
    readonly parameter: string;
    /** Laravel's {parameter:key} custom implicit-binding key, when present. */
    readonly customKey?: string;
}
export const createRouteBindingDeclarationAst = (parameter: string, customKey?: string): RouteBindingDeclarationAst => Object.freeze({
    parameter,
    ...presenceFold(presenceOf(customKey), () => Object.freeze({}), key => Object.freeze({ customKey: key })),
});
export function parseRouteBindingDeclarations(path: string): readonly RouteBindingDeclarationAst[] {
    const parameterPattern = /\{(?<parameter>[A-Za-z_][A-Za-z0-9_]*)(?::(?<key>[A-Za-z_][A-Za-z0-9_]*))?(?<optional>\?)?\}/g;
    return Object.freeze(expandRelation([...path.matchAll(parameterPattern)], match => presenceFold(presenceOf<string>(match.groups?.parameter), () => [], parameter => [createRouteBindingDeclarationAst(parameter, match.groups?.key)])));
}
