/**
 * Closed semantic authority for route perimeter coordinates.
 *
 * The authoring contract remains an adapter. The semantic core consumes only
 * Presence-valued evidence and emits a proof-bearing judgment.
 */
import type { RouteActionKind, RouteParameter, RouteQueryParameter } from "../../../../types/route";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import type { ActionName, ControllerName, DomainTypeName, PropertyName, ResourceName, RouteName, RoutePath } from "../../../../types/upstream/names";
import { HTTP_METHOD_REGISTRY, ROUTE_ACTION_KIND_REGISTRY } from "../../../../types/route";
import { RouteParameterSemanticFactory } from "../../descriptors/routeDescriptors";
import { toCamelCase, toSnakeCase } from "../../../../utils/resource-naming";
import { RouteDomainResolver } from "../RouteDomainResolver";
import { relationAll, relationAny, relationEqual, relationNotEqual, relationGate, relationSome } from "../../../../semantic/kernel/semanticRelations";
import { relationFold, relationProject, relationSelect, relationSlice, relationTextSlice, relationLookup, relationOptionFold, relationOptionValue, relationAt, relationFirstOption, relationTextEnclosedFields, relationTextFields, relationTextReplaceEnclosed, relationTextTrimChars, relationTextStartsWith, relationTextEndsWith, relationTextLower, relationTextNumber, relationLastIndexOf, relationTextTrimEndChars, relationVariant } from "../../../../semantic/kernel/relationalSequence";
import type { RelationOption } from "../../../../semantic/kernel/relationalSequence";
import { presenceFold, presenceOf, type Presence } from "../../../../types/upstream/presence";
import type {
    RouteBoundaryContract,
    RouteBoundaryOptions,
    IntermediateRouteBoundaryBasics
} from "./boundaryBasicsTypes";

export type { RouteBoundaryContract, RouteBoundaryOptions, IntermediateRouteBoundaryBasics };

export type RouteBoundaryBasicsSemanticInput = Readonly<{
    readonly path: RoutePath;
    readonly controllerName: Presence<ControllerName>;
    readonly actionName: Presence<ActionName>;
    readonly action: Presence<ActionName>;
    readonly actionKind: Presence<RouteActionKind>;
    readonly method: RouteBoundaryOptions['method'];
    readonly domain: Presence<DomainTypeName>;
    readonly resourceName: Presence<ResourceName>;
    readonly parameters: Presence<readonly RouteParameter[]>;
    readonly pathParameters: Presence<readonly RouteParameter[]>;
    readonly queryParameters: Presence<readonly RouteQueryParameter[]>;
    readonly groupName: Presence<DomainTypeName>;
    readonly runtimePath: Presence<RoutePath>;
    readonly constantKey: Presence<PropertyName>;
    readonly name: Presence<RouteName>;
}>;

export type RouteBoundaryBasicsFact =
    | Readonly<{ readonly kind: 'resolved_coordinate'; readonly name: 'controller' | 'actionName' | 'action' | 'domain' | 'resource' | 'group' | 'runtimePath' | 'constantKey' | 'routeName'; readonly value: string }>
    | Readonly<{ readonly kind: 'resolved_action_kind'; readonly value: RouteActionKind }>
    | Readonly<{ readonly kind: 'method_classification'; readonly method: RouteBoundaryOptions['method']; readonly isGet: boolean; readonly isHead: boolean }>
    | Readonly<{ readonly kind: 'parameter_projection'; readonly all: readonly RouteParameter[]; readonly path: readonly RouteParameter[]; readonly query: readonly RouteQueryParameter[] }>;

export type RouteBoundaryBasicsJudgment = Readonly<{
    readonly kind: 'route_boundary_basics_judgment';
    readonly result: IntermediateRouteBoundaryBasics;
    readonly facts: readonly RouteBoundaryBasicsFact[];
    readonly closure: 'least_fixed_point';
    readonly reasoning: 'declarative_relation_rewrite_fixed_point';
    readonly authority: 'route_boundary_basics_judgment';
    readonly closed: true;
}>;

const boundaryPresence = <T>(value: Presence<T>): RelationOption<T> =>
    relationOptionFold(relationVariant(value, 'present'), () => ({ kind: 'none' }), item => ({ kind: 'some', value: item.value }));

const semanticInputFromAuthoring = (params: RouteBoundaryOptions): RouteBoundaryBasicsSemanticInput => Object.freeze({
    path: params.path,
    controllerName: presenceOf(params.controllerName),
    actionName: presenceOf(params.actionName),
    action: presenceOf(params.action),
    actionKind: presenceOf(params.actionKind),
    method: params.method,
    domain: presenceOf(params.domain),
    resourceName: presenceOf(params.resourceName),
    parameters: presenceOf(params.parameters),
    pathParameters: presenceOf(params.pathParameters),
    queryParameters: presenceOf(params.queryParameters),
    groupName: presenceOf(params.groupName),
    runtimePath: presenceOf(params.runtimePath),
    constantKey: presenceOf(params.constantKey),
    name: presenceOf(params.name),
});

export const resolveRouteBoundaryBasicsJudgment = (input: RouteBoundaryBasicsSemanticInput): RouteBoundaryBasicsJudgment => {
    const path = input.path.value.value;
    const resolvedControllerName = relationOptionValue(boundaryPresence(input.controllerName), SemanticValueFactory.controllerName(""));
    const initialActionName = relationOptionValue(boundaryPresence(input.actionName), SemanticValueFactory.actionName(""));
    const actionText = relationOptionFold(boundaryPresence(input.action), () => initialActionName.value.value, value => value.value.value);
    const actionParts = relationTextFields(actionText, "@");
    const controllerPart = relationOptionValue(relationAt(actionParts, 0), "");
    const actionPart = relationOptionValue(relationAt(actionParts, 1), actionText);
    const inferredController = relationGate(
        relationAll([relationEqual(resolvedControllerName.value.value, ""), relationNotEqual(controllerPart, "")]),
        () => SemanticValueFactory.controllerName(controllerPart),
        () => resolvedControllerName,
    );
    const inferredActionName = relationGate(
        relationAll([relationEqual(initialActionName.value.value, ""), relationNotEqual(actionPart, "")]),
        () => SemanticValueFactory.actionName(actionPart),
        () => initialActionName,
    );
    const resolvedActionName = relationGate(
        relationNotEqual(actionText, ""),
        () => inferredActionName,
        () => initialActionName,
    );
    const methodSpecification = HTTP_METHOD_REGISTRY[input.method];
    const isGetMethod = relationEqual(input.method, "GET");
    const isHeadMethod = relationEqual(input.method, "HEAD");
    const resolvedActionKind = relationOptionValue(boundaryPresence(input.actionKind), resolveActionKindFromActionName(resolvedActionName, methodSpecification.actionKind));
    const resolvedIsMutating = ROUTE_ACTION_KIND_REGISTRY[resolvedActionKind].isMutating;
    const actionFromKind = actionNameForKind(resolvedActionKind);
    const finalActionName = relationGate(
        relationEqual(resolvedActionName.value.value, ""),
        () => actionFromKind,
        () => resolvedActionName,
    );
    const finalAction = relationOptionFold(
        boundaryPresence(input.action),
        () => SemanticValueFactory.actionName(
            relationGate(
                relationNotEqual(inferredController.value.value, ""),
                () => `${inferredController.value.value}@${finalActionName.value.value}`,
                () => finalActionName.value.value,
            ),
        ),
        value => value,
    );
    const resolvedDomain = relationOptionValue(
        boundaryPresence(input.domain),
        RouteDomainResolver.resolve({
            domain: boundaryPresence(input.domain),
            resourceName: boundaryPresence(input.resourceName),
            controllerName: relationSome(inferredController),
            path: relationSome(input.path),
            actionName: relationSome(finalActionName),
        }),
    );
    const cleanPath = relationTextTrimChars(path, ["/"]);
    const pathSegments = relationSelect(
        relationTextFields(cleanPath, "/"),
        segment => relationAll([
            relationNotEqual(segment, ""),
            relationNotEqual(segment, "api"),
            relationNotEqual(relationTextLower(segment), "api"),
            relationNotEqual(segment, ""),
            relationNotEqual(relationTextSlice(segment, 0, 1), "{"),
            relationNotEqual(relationTextSlice(segment, 0, 1), ":"),
            relationAny([
                relationNotEqual(relationTextLower(relationTextSlice(segment, 0, 1)), "v"),
                relationTextNumber(relationTextSlice(segment, 1), -1) < 0,
            ]),
        ]),
    );
    const resourceCandidate = relationOptionFold(
        relationFirstOption(pathSegments, () => true),
        () => resolvedDomain.value.value,
        segment => segment,
    );
    const resolvedResourceName = relationOptionValue(
        boundaryPresence(input.resourceName),
        SemanticValueFactory.resourceName(resourceCandidate),
    );
    const inputParameters = relationOptionValue(boundaryPresence(input.parameters), []);
    const resolvedPathParameters = relationOptionValue(
        boundaryPresence(input.pathParameters),
        relationOptionFold(
            relationFirstOption(inputParameters, () => true),
            () => relationProject(relationTextEnclosedFields(path, "{", "}"), value => RouteParameterSemanticFactory.fromPathSegment(value)),
            () => relationSelect(inputParameters, parameter => relationEqual(parameter.location.kind, "path")),
        ),
    );
    const resolvedParameters = relationOptionFold(
        relationFirstOption(inputParameters, () => true),
        () => resolvedPathParameters,
        () => inputParameters,
    );
    const resolvedQueryParameters = relationOptionValue(boundaryPresence(input.queryParameters), []);
    const resolvedGroupName = relationOptionValue(boundaryPresence(input.groupName), SemanticValueFactory.domainName(toCamelCase(resolvedResourceName.value.value)));
    const resolvedRuntimePath = relationOptionValue(
        boundaryPresence(input.runtimePath),
        SemanticValueFactory.routePath(relationTextReplaceEnclosed(path, "{", "}", ":")),
    );
    const resolvedConstantKey = relationOptionValue(boundaryPresence(input.constantKey), SemanticValueFactory.propertyName(deriveRouteConstantKey(input.path)));
    const resolvedRouteName = relationOptionValue(boundaryPresence(input.name), SemanticValueFactory.routeName(`${resolvedResourceName.value.value}.${finalActionName.value.value}`));
    const result = Object.freeze({
        resolvedControllerName: inferredController,
        resolvedActionName: finalActionName,
        resolvedAction: finalAction,
        isGetMethod,
        isHeadMethod,
        resolvedActionKind,
        resolvedIsMutating,
        resolvedDomain,
        resolvedResourceName,
        resolvedParameters,
        resolvedPathParameters,
        resolvedQueryParameters,
        resolvedGroupName,
        resolvedRuntimePath,
        resolvedConstantKey,
        resolvedRouteName,
    });
    const facts = Object.freeze([
        Object.freeze({ kind: 'resolved_coordinate' as const, name: 'controller' as const, value: result.resolvedControllerName.value.value }),
        Object.freeze({ kind: 'resolved_coordinate' as const, name: 'actionName' as const, value: result.resolvedActionName.value.value }),
        Object.freeze({ kind: 'resolved_coordinate' as const, name: 'action' as const, value: result.resolvedAction.value.value }),
        Object.freeze({ kind: 'resolved_coordinate' as const, name: 'domain' as const, value: result.resolvedDomain.value.value }),
        Object.freeze({ kind: 'resolved_coordinate' as const, name: 'resource' as const, value: result.resolvedResourceName.value.value }),
        Object.freeze({ kind: 'resolved_coordinate' as const, name: 'group' as const, value: result.resolvedGroupName.value.value }),
        Object.freeze({ kind: 'resolved_coordinate' as const, name: 'runtimePath' as const, value: result.resolvedRuntimePath.value.value }),
        Object.freeze({ kind: 'resolved_coordinate' as const, name: 'constantKey' as const, value: result.resolvedConstantKey.value.value }),
        Object.freeze({ kind: 'resolved_coordinate' as const, name: 'routeName' as const, value: result.resolvedRouteName.value.value }),
        Object.freeze({ kind: 'resolved_action_kind' as const, value: result.resolvedActionKind }),
        Object.freeze({ kind: 'method_classification' as const, method: input.method, isGet: result.isGetMethod, isHead: result.isHeadMethod }),
        Object.freeze({ kind: 'parameter_projection' as const, all: result.resolvedParameters, path: result.resolvedPathParameters, query: result.resolvedQueryParameters }),
    ] satisfies readonly RouteBoundaryBasicsFact[]);
    return Object.freeze({ kind: 'route_boundary_basics_judgment', result, facts, closure: 'least_fixed_point', reasoning: 'declarative_relation_rewrite_fixed_point', authority: 'route_boundary_basics_judgment', closed: true });
};

export const resolveRouteBoundaryBasics = (params: RouteBoundaryOptions): IntermediateRouteBoundaryBasics => resolveRouteBoundaryBasicsJudgment(semanticInputFromAuthoring(params)).result;

export const routeBoundaryBasicsInterface = (params: RouteBoundaryOptions): RouteBoundaryBasicsJudgment => resolveRouteBoundaryBasicsJudgment(semanticInputFromAuthoring(params));

export function deriveRouteConstantKey(routePath: RoutePath): string {
    const segments = relationTextFields(relationTextTrimChars(routePath.value.value, ["/"]), "/");
    const state = relationFold(segments, { keys: [] as readonly string[] }, (current, segment) => {
        const parameter = relationAll([
            relationEqual(relationTextSlice(segment, 0, 1), "{"),
            relationTextEndsWith(segment, "}"),
        ]);
        const colonParameter = relationTextStartsWith(segment, ":");
        return relationGate(relationAny([parameter, colonParameter]), () => {
            const parameterName = relationGate(colonParameter, () => relationTextSlice(segment, 1), () => relationTextTrimEndChars(relationTextSlice(segment, 1), ["}"]));
            return relationGate(relationEqual(relationTextLower(parameterName), "id"), () => ({ keys: [...current.keys, "DETAIL"] }), () => {
                const previousIndex = relationLastIndexOf(current.keys, () => true);
                const previous = relationOptionValue(relationAt(current.keys, previousIndex), "");
                const plural = relationTextEndsWith(previous, "S");
                const normalizedPrevious = relationGate(plural, () => relationTextTrimEndChars(previous, ["S"]), () => previous);
                const cleanParameter = toSnakeCase(parameterName).toUpperCase();
                const nextKeys = relationGate(plural, () => [...relationSlice(current.keys, 0, previousIndex), normalizedPrevious, cleanParameter], () => [...current.keys, cleanParameter]);
                return { keys: nextKeys };
            });
        }, () => ({ keys: [...current.keys, toSnakeCase(segment).toUpperCase()] }));
    });
    return state.keys.join("_");
}

function resolveActionKindFromActionName(actionName: ActionName, fallback: RouteActionKind): RouteActionKind {
    const catalog: readonly (readonly [string, RouteActionKind])[] = [
        ["index", "read"], ["show", "read"], ["read", "read"], ["store", "create"], ["create", "create"],
        ["update", "update"], ["edit", "update"], ["destroy", "delete"], ["delete", "delete"],
    ];
    return relationOptionFold(relationLookup(catalog, actionName.value.value), () => fallback, value => value);
}

function actionNameForKind(kind: RouteActionKind): ActionName {
    const catalog: readonly (readonly [RouteActionKind, ActionName])[] = [
        ["create", SemanticValueFactory.actionName("create")], ["update", SemanticValueFactory.actionName("update")],
        ["delete", SemanticValueFactory.actionName("delete")], ["read", SemanticValueFactory.actionName("read")],
    ];
    return relationOptionFold(relationLookup(catalog, kind), () => SemanticValueFactory.actionName("read"), value => value);
}
