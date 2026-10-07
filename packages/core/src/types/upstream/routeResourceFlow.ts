/**
 * Canonical Laravel resource-route semantic resolver.
 *
 * Ownership:
 * - understands Laravel resource routing semantics;
 * - produces an immutable route action plan;
 * - downstream emitters consume the plan and do not reconstruct Laravel rules.
 */
import type { ActionName, PropertyName, RouteParameterName, RoutePath, ResourceName } from './names';
import { createActionName, createRouteParameterName, createRoutePath } from './names';
import type { RouteResourceRegistration } from './route';
import type { Sequence } from './collections';
import { relationContains } from '../../semantic/foundation/relationMembership';
import { relationVariantFold } from '../../semantic/foundation/relationalSequence';
import {
  relationEqual,
  relationFirstOption,
  relationOptionFold,
  relationProject,
  relationRange,
  relationResolve,
  relationSelect,
  relationExpand,
  relationAll,
  type RelationOption,
} from '../../semantic/foundation/relationalSequence';

export type RouteResourceAction =
  | 'index' | 'create' | 'store' | 'show' | 'edit' | 'update' | 'destroy';

export type ApiResourceAction = Exclude<RouteResourceAction, 'create' | 'edit'>;
export type RouteResourceMode = 'resource' | 'apiResource' | 'singleton' | 'apiSingleton';

export type ApiResourceHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RouteResourceActionPlan {
  readonly action: ActionName;
  readonly method: ApiResourceHttpMethod;
  readonly path: RoutePath;
  readonly parameter: RouteParameterName | { readonly kind: 'absent' };
  /** Parameters already resolved upstream; emitters must not parse them from the URI. */
  readonly parameters: readonly RouteParameterName[];
}

export interface RouteResourceFlowPlan {
  readonly kind: 'route_resource_flow_plan';
  readonly resource: ResourceName;
  readonly parameterNames: readonly RouteParameterName[];
  readonly actions: readonly RouteResourceActionPlan[];
}

export interface RouteResourceFlowJudgment {
  readonly kind: 'route_resource_flow_judgment';
  readonly input: 'laravel_route_resource_registration';
  readonly plan: RouteResourceFlowPlan;
  readonly resolution: 'resource_action_relation_closure';
  readonly target: 'nextjs_typescript_route_surface';
  readonly closed: true;
}

const sequenceToArray = <T>(sequence: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  sequence.kind === 'empty' ? output : sequenceToArray(sequence.tail, Object.freeze([...output, sequence.head]));

const emptySequence = <T>(): Sequence<T> => ({ kind: 'empty' });

/** Laravel resource naming knowledge, represented as declarative rewrite data. */
interface ExactResourceNameRule { readonly kind: 'exact'; readonly input: string; readonly output: string }
interface SuffixResourceNameRule { readonly kind: 'suffix'; readonly pattern: RegExp; readonly transform: (value: string) => string }
type ResourceNameRule = ExactResourceNameRule | SuffixResourceNameRule;

const RESOURCE_NAME_EXACT_KNOWLEDGE: readonly ExactResourceNameRule[] = Object.freeze([
  Object.freeze({ kind: 'exact', input: 'people', output: 'person' }),
  Object.freeze({ kind: 'exact', input: 'men', output: 'man' }),
  Object.freeze({ kind: 'exact', input: 'women', output: 'woman' }),
  Object.freeze({ kind: 'exact', input: 'children', output: 'child' }),
  Object.freeze({ kind: 'exact', input: 'teeth', output: 'tooth' }),
  Object.freeze({ kind: 'exact', input: 'feet', output: 'foot' }),
  Object.freeze({ kind: 'exact', input: 'geese', output: 'goose' }),
  Object.freeze({ kind: 'exact', input: 'mice', output: 'mouse' }),
  Object.freeze({ kind: 'exact', input: 'oxen', output: 'ox' }),
  Object.freeze({ kind: 'exact', input: 'categories', output: 'category' }),
  Object.freeze({ kind: 'exact', input: 'companies', output: 'company' }),
  Object.freeze({ kind: 'exact', input: 'policies', output: 'policy' }),
  Object.freeze({ kind: 'exact', input: 'stories', output: 'story' }),
  Object.freeze({ kind: 'exact', input: 'deliveries', output: 'delivery' }),
  Object.freeze({ kind: 'exact', input: 'addresses', output: 'address' }),
  Object.freeze({ kind: 'exact', input: 'statuses', output: 'status' }),
  Object.freeze({ kind: 'exact', input: 'analyses', output: 'analysis' }),
  Object.freeze({ kind: 'exact', input: 'crises', output: 'crisis' }),
  Object.freeze({ kind: 'exact', input: 'indices', output: 'index' }),
  Object.freeze({ kind: 'exact', input: 'matrices', output: 'matrix' }),
]);

const RESOURCE_NAME_SUFFIX_KNOWLEDGE: readonly SuffixResourceNameRule[] = Object.freeze([
  Object.freeze({ kind: 'suffix', pattern: /(ss|us|is|ous)$/, transform: (value: string) => value }),
  Object.freeze({ kind: 'suffix', pattern: /(ches|shes|xes|zes|sses)$/, transform: (value: string) => value.replace(/es$/, '') }),
  Object.freeze({ kind: 'suffix', pattern: /ies$/, transform: (value: string) => value.replace(/ies$/, 'y') }),
  Object.freeze({ kind: 'suffix', pattern: /ves$/, transform: (value: string) => value.replace(/ves$/, 'f') }),
  Object.freeze({ kind: 'suffix', pattern: /s$/, transform: (value: string) => value.replace(/s$/, '') }),
]);

const exactResourceName = (value: string): RelationOption<string> => relationOptionFold(
  relationFirstOption(RESOURCE_NAME_EXACT_KNOWLEDGE, rule => relationEqual(rule.input, value)),
  () => ({ kind: 'none' }),
  rule => ({ kind: 'some', value: rule.output }),
);

const suffixResourceName = (value: string): RelationOption<string> => relationOptionFold(
  relationFirstOption(RESOURCE_NAME_SUFFIX_KNOWLEDGE, rule => rule.pattern.test(value)),
  () => ({ kind: 'none' }),
  rule => ({ kind: 'some', value: rule.transform(value) }),
);

export function singularizeLaravelResourceName(value: string): string {
  const lower = value.toLowerCase();
  return relationOptionFold(
    exactResourceName(lower),
    () => relationOptionFold(suffixResourceName(lower), () => lower, suffix => suffix),
    exact => exact,
  );
}

export interface ResourceActionKnowledge {
  readonly action: RouteResourceAction;
  readonly methods: readonly ApiResourceHttpMethod[];
  readonly modes: readonly RouteResourceMode[];
  readonly suffix: '' | '/create' | '/edit';
  readonly parameter: 'absent' | 'leaf';
  readonly capability: 'creatable' | 'destroyable' | 'always';
}

/** Laravel resource semantics as data, not action predicates. */
export const RESOURCE_ACTION_KNOWLEDGE: readonly ResourceActionKnowledge[] = Object.freeze([
  Object.freeze({ action: 'index', methods: Object.freeze(['GET'] as const), modes: Object.freeze(['resource', 'apiResource'] as const), suffix: '', parameter: 'absent', capability: 'always' }),
  Object.freeze({ action: 'create', methods: Object.freeze(['GET'] as const), modes: Object.freeze(['resource', 'singleton'] as const), suffix: '/create', parameter: 'absent', capability: 'creatable' }),
  Object.freeze({ action: 'store', methods: Object.freeze(['POST'] as const), modes: Object.freeze(['resource', 'apiResource', 'singleton', 'apiSingleton'] as const), suffix: '', parameter: 'absent', capability: 'creatable' }),
  Object.freeze({ action: 'show', methods: Object.freeze(['GET'] as const), modes: Object.freeze(['resource', 'apiResource', 'singleton', 'apiSingleton'] as const), suffix: '', parameter: 'leaf', capability: 'always' }),
  Object.freeze({ action: 'edit', methods: Object.freeze(['GET'] as const), modes: Object.freeze(['resource', 'singleton'] as const), suffix: '/edit', parameter: 'leaf', capability: 'always' }),
  Object.freeze({ action: 'update', methods: Object.freeze(['PUT', 'PATCH'] as const), modes: Object.freeze(['resource', 'apiResource', 'singleton', 'apiSingleton'] as const), suffix: '', parameter: 'leaf', capability: 'always' }),
  Object.freeze({ action: 'destroy', methods: Object.freeze(['DELETE'] as const), modes: Object.freeze(['resource', 'singleton', 'apiSingleton'] as const), suffix: '', parameter: 'leaf', capability: 'destroyable' }),
]);

const knownAction = (value: ActionName): RelationOption<RouteResourceAction> => {
  const option = relationFirstOption(RESOURCE_ACTION_KNOWLEDGE, knowledge => relationEqual(knowledge.action, value.value.value));
  return relationOptionFold(option, () => ({ kind: 'none' }), knowledge => ({ kind: 'some', value: knowledge.action }));
};

const actionNames = (registration: RouteResourceRegistration): readonly RouteResourceAction[] =>
  Object.freeze(relationExpand(sequenceToArray(registration.only), item => relationOptionFold(knownAction(item), () => [], value => [value])));

const exceptNames = (registration: RouteResourceRegistration): readonly RouteResourceAction[] =>
  Object.freeze(relationExpand(sequenceToArray(registration.except), item => relationOptionFold(knownAction(item), () => [], value => [value])));

const capabilityValue = (mode: RouteResourceMode, registration: RouteResourceRegistration, capability: ResourceActionKnowledge['capability']): boolean =>
  capability === 'always'
    ? true
    : capability === 'creatable'
      ? (mode === 'resource' || mode === 'apiResource' || registration.creatable.value)
      : (mode === 'resource' || mode === 'apiResource' ? true : registration.destroyable.value);

const actionAllowed = (registration: RouteResourceRegistration, knowledge: ResourceActionKnowledge): boolean =>
  relationResolve(
    relationEqual(actionNames(registration).length, 0),
    () => true,
    () => relationContains(actionNames(registration), knowledge.action),
  );

const actionExcluded = (registration: RouteResourceRegistration, knowledge: ResourceActionKnowledge): boolean =>
  relationContains(exceptNames(registration), knowledge.action);

const actionsOf = (registration: RouteResourceRegistration, mode: RouteResourceMode): readonly ResourceActionKnowledge[] =>
  Object.freeze(relationSelect(RESOURCE_ACTION_KNOWLEDGE, knowledge =>
    relationAll([
      relationContains(knowledge.modes, mode),
      actionAllowed(registration, knowledge),
      relationResolve(actionExcluded(registration, knowledge), () => false, () => capabilityValue(mode, registration, knowledge.capability)),
    ]),
  ));

const resourceSegments = (rawResourcePath: string): readonly string[] =>
  relationSelect(rawResourcePath.replace(/^\/+|\/+$/g, '').split('.'), segment => segment.length > 0);

export interface ResolveApiResourceFlowInput {
  readonly mode?: RouteResourceMode;
  readonly declarationPath: RoutePath;
  readonly prefix: readonly RoutePath[];
  readonly resource: ResourceName;
  readonly registration: RouteResourceRegistration;
}

const lastValue = <T>(values: readonly T[], fallback: T): T =>
  relationResolve(values.length > 0, () => values[values.length - 1], () => fallback);

const parameterPath = (segments: readonly string[], parameters: readonly RouteParameterName[]): readonly string[] =>
  relationProject(segments, (segment, index) => `${segment}/{${parameters[index].value.value}}`);

/**
 * Resolves Laravel apiResource declaration semantics before any dumb emitter.
 * Nested resources use dot notation (`photos.comments`) and produce the
 * canonical parent/child URI parameters.
 */
export const resolveApiResourceFlowJudgment = (input: ResolveApiResourceFlowInput): RouteResourceFlowJudgment => {
  const segments = resourceSegments(input.declarationPath.value.value);
  const parameterNames = Object.freeze(relationProject(segments, segment => createRouteParameterName(singularizeLaravelResourceName(segment))));
  const prefix = relationProject(input.prefix, item => item.value.value).join('/');
  const parentSegments = parameterPath(relationRange(segments, 0, Math.max(segments.length - 1, 0)), parameterNames);
  const leafSegment = lastValue(segments, input.resource.value.value);
  const baseSegments = Object.freeze([...parentSegments, leafSegment]);
  const basePath = `/${relationSelect([prefix, ...baseSegments], segment => segment.length > 0).join('/')}`;
  const leafParameter = lastValue(parameterNames, createRouteParameterName(singularizeLaravelResourceName(input.resource.value.value)));
  const shallowPath = `/${relationSelect([prefix, leafSegment], segment => segment.length > 0).join('/')}/{${leafParameter.value.value}}`;
  const nestedPath = `${basePath}/{${leafParameter.value.value}}`;
  const itemPath = relationResolve(input.registration.shallow.value, () => shallowPath, () => nestedPath);
  const collectionPath = createRoutePath(basePath);
  const item = createRoutePath(itemPath);
  const mode = input.mode ?? 'apiResource';
  const selected = actionsOf(input.registration, mode);
  const parameters = Object.freeze({ absent: Object.freeze([]), leaf: Object.freeze([...parameterNames]) });
  const plan = Object.freeze(relationExpand(selected, knowledge => relationProject(knowledge.methods, method => {
    const singleton = mode === 'singleton' || mode === 'apiSingleton';
    const hasLeafParameter = knowledge.parameter === 'leaf' && !singleton;
    const base = hasLeafParameter ? item : collectionPath;
    const path = createRoutePath(`${base.value.value}${knowledge.suffix}`);
    return {
      action: createActionName(knowledge.action),
      method,
      path,
      parameter: hasLeafParameter ? leafParameter : ({ kind: 'absent' } as const),
      parameters: hasLeafParameter ? parameters.leaf : parameters.absent,
    };
  })));

  const planResult: RouteResourceFlowPlan = Object.freeze({
    kind: 'route_resource_flow_plan',
    resource: input.resource,
    parameterNames: Object.freeze(parameterNames),
    actions: plan,
  });
  return Object.freeze({
    kind: 'route_resource_flow_judgment',
    input: 'laravel_route_resource_registration',
    plan: planResult,
    resolution: 'resource_action_relation_closure',
    target: 'nextjs_typescript_route_surface',
    closed: true,
  });
}

export function resolveRouteResourceFlowJudgment(input: ResolveApiResourceFlowInput & { readonly mode: RouteResourceMode }): RouteResourceFlowJudgment {
  return resolveApiResourceFlowJudgment(input);
}

export function resolveRouteResourceFlow(input: ResolveApiResourceFlowInput & { readonly mode: RouteResourceMode }): RouteResourceFlowPlan {
  return resolveRouteResourceFlowJudgment(input).plan;
}

export function resolveApiResourceFlow(input: ResolveApiResourceFlowInput): RouteResourceFlowPlan {
  return resolveApiResourceFlowJudgment({ ...input, mode: input.mode ?? 'apiResource' }).plan;
}

export function defaultApiResourceRegistration(resource: ResourceName, controller: RouteResourceRegistration['controller']): RouteResourceRegistration {
  return Object.freeze({
    kind: 'route_resource_registration',
    name: resource,
    controller,
    only: emptySequence<ActionName>(),
    except: emptySequence<ActionName>(),
    shallow: { kind: 'truth_value' as const, value: false },
    scoped: { kind: 'truth_value' as const, value: false },
    parameters: emptySequence<PropertyName>(),
    creatable: { kind: 'truth_value' as const, value: false },
    destroyable: { kind: 'truth_value' as const, value: false },
    middleware: emptySequence<import('./route').RouteResourceMiddlewareRule>(),
  });
}
