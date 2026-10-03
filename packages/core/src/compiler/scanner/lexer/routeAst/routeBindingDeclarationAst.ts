import { projectRelation, selectRelation, expandRelation, accumulateRelation } from '../../../relational/sequence';
import { fromOptional, isPresent, presenceFold } from '../../../../types/upstream/presence';
/** Syntax-level route-model binding facts extracted from a Laravel route URI. */
export interface RouteBindingDeclarationAst {
    readonly parameter: string;
    /** Laravel's {parameter:key} custom implicit-binding key, when present. */
    readonly customKey?: string;
}
export const createRouteBindingDeclarationAst = (parameter: string, customKey?: string): RouteBindingDeclarationAst => Object.freeze({
    parameter,
    ...presenceFold(fromOptional(customKey), () => Object.freeze({}), key => Object.freeze({ customKey: key })),
});
export function parseRouteBindingDeclarations(path: string): readonly RouteBindingDeclarationAst[] {
    const parameterPattern = /\{(?<parameter>[A-Za-z_][A-Za-z0-9_]*)(?::(?<key>[A-Za-z_][A-Za-z0-9_]*))?(?<optional>\?)?\}/g;
    return Object.freeze(expandRelation([...path.matchAll(parameterPattern)], match => projectRelation(selectRelation([fromOptional(match.groups?.parameter)], isPresent), parameter => createRouteBindingDeclarationAst(parameter.value, match.groups?.key))));
}
