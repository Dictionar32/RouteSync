import { projectRelation, selectRelation, expandRelation, accumulateRelation, relationResolve } from '../../../relational/sequence';
import type { Presence } from '../../../../types/upstream/presence';
import { relationEqual } from '../../../../semantic/relations/semanticRelations';
import type { TokenDescriptor } from '../phpAstTypes';
import { resourceMiddlewareScopeOperation } from './semanticRouteSyntaxRelations';
export type RouteResourceMethodAst = 'resource' | 'apiResource' | 'singleton' | 'apiSingleton';
export type RouteResourceNameAst = string & {
    readonly __routeResourceNameAst: unique symbol;
};
export type RouteResourceControllerAst = string & {
    readonly __routeResourceControllerAst: unique symbol;
};
export type RouteResourceActionAst = string & {
    readonly __routeResourceActionAst: unique symbol;
};
export type RouteResourceRouteNameAst = string & {
    readonly __routeResourceRouteNameAst: unique symbol;
};
export type RouteResourceParameterAst = string & {
    readonly __routeResourceParameterAst: unique symbol;
};
export interface RouteResourceMiddlewareAst {
    readonly middleware: readonly string[];
    readonly scope: {
        readonly kind: 'all' | 'only' | 'except';
        readonly actions: readonly string[];
    };
}
export interface RouteResourceMiddlewareSyntax {
    readonly middleware: readonly string[];
    readonly actions: readonly string[];
}
type ResourceMiddlewareAstBuilder = (method: 'middleware' | 'middlewareFor' | 'withoutMiddlewareFor', syntax: RouteResourceMiddlewareSyntax) => Presence<RouteResourceMiddlewareAst>;
const buildRouteResourceMiddlewareAst: ResourceMiddlewareAstBuilder = (method, syntax) => {
    const values = projectRelation(selectRelation([syntax.middleware], value => value.length > 0), value => value);
    return relationResolve(values.length > 0,
        () => ({ kind: 'present', value: Object.freeze({
            middleware: Object.freeze([...values[0]]),
            scope: Object.freeze({ kind: resourceMiddlewareScopeOperation.resolve(method), actions: Object.freeze([...syntax.actions]) }),
        }) }),
        () => ({ kind: 'absent' }),
    );
};
const RESOURCE_MIDDLEWARE_AST_BUILDERS: readonly (readonly [string, ResourceMiddlewareAstBuilder])[] = [
    ['middleware', buildRouteResourceMiddlewareAst],
    ['middlewareFor', buildRouteResourceMiddlewareAst],
    ['withoutMiddlewareFor', buildRouteResourceMiddlewareAst],
];
const deriveRouteResourceMiddlewareAst = (method: 'middleware' | 'middlewareFor' | 'withoutMiddlewareFor', syntax: RouteResourceMiddlewareSyntax): Presence<RouteResourceMiddlewareAst> => {
    const builders = projectRelation(selectRelation(RESOURCE_MIDDLEWARE_AST_BUILDERS, ([key]) => relationEqual(key, method)), ([, builder]) => builder);
    return relationResolve(builders.length > 0, () => builders[0](method, syntax), () => ({ kind: 'absent' }));
};
export interface RouteResourceDeclarationAst {
    readonly method: RouteResourceMethodAst;
    readonly resource: RouteResourceNameAst;
    readonly controller: RouteResourceControllerAst;
    readonly withTrashed?: readonly RouteResourceActionAst[];
    readonly actionFilter?: {
        readonly kind: 'only' | 'except';
        readonly actions: readonly RouteResourceActionAst[];
    };
    readonly names?: {
        readonly names: readonly {
            readonly action: RouteResourceActionAst;
            readonly name: RouteResourceRouteNameAst;
        }[];
    };
    readonly parameters?: {
        readonly parameters: readonly {
            readonly resource: RouteResourceNameAst;
            readonly parameter: RouteResourceParameterAst;
        }[];
    };
    readonly shallow: boolean;
    readonly scoped?: {
        readonly parameters: readonly {
            readonly parameter: RouteResourceParameterAst;
            readonly key: RouteResourceParameterAst;
        }[];
    };
    readonly creatable: boolean;
    readonly destroyable: boolean;
    readonly middleware: readonly RouteResourceMiddlewareAst[];
    readonly middlewareExclusions: readonly RouteResourceMiddlewareAst[];
    readonly source: TokenDescriptor;
}
export interface RouteResourceMiddlewareAstOperationInterface {
    readonly derive: (method: 'middleware' | 'middlewareFor' | 'withoutMiddlewareFor', syntax: RouteResourceMiddlewareSyntax) => Presence<RouteResourceMiddlewareAst>;
}
export interface RouteResourceNameAstFactoryInterface { readonly create: (value: string) => RouteResourceNameAst; }
export interface RouteResourceControllerAstFactoryInterface { readonly create: (value: string) => RouteResourceControllerAst; }
export interface RouteResourceActionAstFactoryInterface { readonly create: (value: string) => RouteResourceActionAst; }
export interface RouteResourceRouteNameAstFactoryInterface { readonly create: (value: string) => RouteResourceRouteNameAst; }
export interface RouteResourceParameterAstFactoryInterface { readonly create: (value: string) => RouteResourceParameterAst; }
export const routeResourceMiddlewareAstOperation: RouteResourceMiddlewareAstOperationInterface = Object.freeze({ derive: deriveRouteResourceMiddlewareAst });
export const routeResourceNameAstFactory: RouteResourceNameAstFactoryInterface = Object.freeze({ create: (value: string) => value as RouteResourceNameAst });
export const routeResourceControllerAstFactory: RouteResourceControllerAstFactoryInterface = Object.freeze({ create: (value: string) => value as RouteResourceControllerAst });
export const routeResourceActionAstFactory: RouteResourceActionAstFactoryInterface = Object.freeze({ create: (value: string) => value as RouteResourceActionAst });
export const routeResourceRouteNameAstFactory: RouteResourceRouteNameAstFactoryInterface = Object.freeze({ create: (value: string) => value as RouteResourceRouteNameAst });
export const routeResourceParameterAstFactory: RouteResourceParameterAstFactoryInterface = Object.freeze({ create: (value: string) => value as RouteResourceParameterAst });
