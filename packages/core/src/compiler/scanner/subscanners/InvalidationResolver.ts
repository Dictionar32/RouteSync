/**
 * Declarative invalidation closure at the origin boundary.
 *
 * Invalidation targets are derived as relations over route, model, relation and
 * group facts. Selection is performed by relation gates/folds; no host control
 * construct is authoritative for the semantic decision.
 */
import {
    RouteSemanticFlow,
    ResourceRouteGroup,
    RouteHookKind,
    InvalidationTarget,
    ScannedInvalidationTarget,
    RouteSemanticFlowInvalidationPayload,
    ScannedEndpointContract,
} from "../../../types/route";
import type { ModelSemanticDefinition } from "../../../types/upstream/model";
import type { ResourceName } from "../../../types/upstream/names";
import type { ModelSemanticRelation } from "../../../types/upstream/model";
import { createResourceName } from "../../../types/upstream/names";
import {
    relationGate,
    relationFold,
    relationProject,
    relationSelect,
    relationFirst,
    relationOptionFold,
    relationNone,
    relationSome,
    relationRefine,
    type RelationOption,
} from "../../../semantic/foundation/relationalSequence";
import { relationAny, relationEqual } from "../../../semantic/foundation/semanticRelations";

type RouteInvalidationContext = Readonly<{
    readonly route: RouteSemanticFlow;
    readonly models: readonly ModelSemanticDefinition[];
    readonly routeGroups: readonly ResourceRouteGroup[];
}>;

const responseModelName = (route: RouteSemanticFlow): RelationOption<string> => {
    const responseAnalysis = route.contract.response.success.descriptor.toAnalysis(
        route.identity.coordinates.name,
        100,
    );
    const model = relationRefine(
        responseAnalysis,
        (candidate): candidate is Extract<typeof responseAnalysis, { readonly kind: 'model' }> => relationEqual(candidate.kind, 'model'),
    );
    return relationOptionFold(
        model,
        () => relationOptionFold(
            relationRefine(
                responseAnalysis,
                (candidate): candidate is Extract<typeof responseAnalysis, { readonly kind: 'resource' }> => relationEqual(candidate.kind, 'resource'),
            ),
            () => relationNone(),
            value => relationSome(value.resourceName.value.value),
        ),
        value => relationSome(value.modelName.value.value),
    );
};

const modelForName = (models: readonly ModelSemanticDefinition[], name: string): RelationOption<ModelSemanticDefinition> =>
    relationFirst(models, model => relationEqual(model.identity.name.value.value, name));

const relationTargets = (model: ModelSemanticDefinition): readonly InvalidationTarget[] => {
    const relations: readonly ModelSemanticRelation[] = model.relation.semantic;
    return Object.freeze(relationFold(relations, Object.freeze([]) as readonly InvalidationTarget[], (targets, rel) => {
        const sourceModel = model.identity.name;
        const additions = relationGate(
            relationEqual(rel.eloquentType.kind, 'belongs_to'),
            () => Object.freeze([
                ScannedInvalidationTarget.parentList(createResourceName(sourceModel.value.value)),
                ScannedInvalidationTarget.parentDetail(createResourceName(sourceModel.value.value)),
            ]),
            () => relationGate(
                relationAny([
                    relationEqual(rel.eloquentType.kind, 'has_many'),
                    relationEqual(rel.eloquentType.kind, 'has_one'),
                ]),
                () => Object.freeze([ScannedInvalidationTarget.resourceItem(createResourceName(sourceModel.value.value))]),
                () => relationGate(
                    relationEqual(rel.eloquentType.kind, 'belongs_to_many'),
                    () => Object.freeze([
                        ScannedInvalidationTarget.resourceList(createResourceName(sourceModel.value.value)),
                        ScannedInvalidationTarget.resourceItem(createResourceName(sourceModel.value.value)),
                    ]),
                    () => Object.freeze([]),
                ),
            ),
        );
        return Object.freeze([...targets, ...additions]);
    }));
};

const childGroupTargets = (
    groups: readonly ResourceRouteGroup[],
    group: ResourceRouteGroup,
): readonly InvalidationTarget[] => {
    const groupName = group.identity.resource;
    const prefix = groupName.value.value.toLowerCase();
    return Object.freeze(relationProject(
        relationSelect(
            groups,
            candidate => relationGate(
                relationEqual(candidate.identity.resource.value.value, groupName.value.value),
                () => false,
                () => candidate.identity.resource.value.value.toLowerCase().startsWith(prefix),
            ),
        ),
        candidate => ScannedInvalidationTarget.resourceList(candidate.identity.resource),
    ));
};

const matchedGroup = (
    groups: readonly ResourceRouteGroup[],
    route: RouteSemanticFlow,
): RelationOption<ResourceRouteGroup> => {
    const normalized = route.identity.domain.resource.value.value.toLowerCase();
    return relationFirst(groups, group => relationEqual(group.identity.resource.value.value.toLowerCase(), normalized));
};

const authGroups = (routes: readonly RouteSemanticFlow[]): readonly ResourceName[] => {
    const authorized = relationSelect(routes, route => Boolean(route.capability.auth));
    const names = relationProject(authorized, route => route.identity.domain.resource);
    return Object.freeze(relationFold(names, Object.freeze([]) as readonly ResourceName[], (acc, name) =>
        relationGate(
            relationEqual(relationFirst(acc, existing => relationEqual(existing.value.value, name.value.value)).kind, 'some'),
            () => acc,
            () => Object.freeze([...acc, name]),
        ),
    ));
};

const routeTargets = (context: RouteInvalidationContext, allRoutes: readonly RouteSemanticFlow[]): readonly InvalidationTarget[] => {
    const base: readonly InvalidationTarget[] = Object.freeze([
        ScannedInvalidationTarget.selfList(context.route.identity.domain.resource),
    ]);
    const modelTargets = relationOptionFold(
        responseModelName(context.route),
        () => Object.freeze([]),
        name => relationOptionFold(
            modelForName(context.models, name),
            () => Object.freeze([]),
            relationTargets,
        ),
    );
    const groupTargets = relationOptionFold(
        matchedGroup(context.routeGroups, context.route),
        () => Object.freeze([]),
        group => childGroupTargets(context.routeGroups, group),
    );
    const authTargets = relationGate(
        relationEqual(context.route.binding.operation.name.value.value, 'logout'),
        () => relationProject(authGroups(allRoutes), name => ScannedInvalidationTarget.authResource(name)),
        () => Object.freeze([]),
    );
    return Object.freeze([...base, ...modelTargets, ...groupTargets, ...authTargets]);
};

const applyInvalidation = (
    route: RouteSemanticFlow,
    invalidation: RouteSemanticFlowInvalidationPayload,
): RouteSemanticFlow => {
    const capability = Object.freeze({
        ...route.capability,
        invalidation: Object.freeze({
            targets: Object.freeze(invalidation.targets),
            queryKeyExpressions: Object.freeze(invalidation.queryKeyExpressions),
        }),
    });
    const contract = ScannedEndpointContract.fromSubcontracts({
        identity: route.identity,
        binding: route.binding,
        capability,
        provenance: route.provenance,
    });
    return Object.freeze({
        ...route,
        capability,
        contract,
    });
};

export const resolveRouteInvalidations = (
    routes: readonly RouteSemanticFlow[],
    models: readonly ModelSemanticDefinition[],
    routeGroups: readonly ResourceRouteGroup[],
): readonly RouteSemanticFlow[] => Object.freeze(relationProject(
    routes,
    route => relationGate(
        relationAny([
            relationEqual(route.capability.hookKind, RouteHookKind.Query),
            relationEqual(route.capability.hookKind, RouteHookKind.InfiniteQuery),
        ]),
        () => route,
        () => applyInvalidation(
            route,
            RouteSemanticFlowInvalidationPayload.fromTargets(routeTargets({ route, models, routeGroups }, routes)),
        ),
    ),
));

export const InvalidationResolver = Object.freeze({ resolveRouteInvalidations });
