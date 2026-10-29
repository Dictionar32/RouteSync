/**
 * Canonical Laravel resource-route semantic resolver.
 *
 * Ownership:
 * - understands Laravel resource routing semantics;
 * - produces an immutable route action plan;
 * - downstream emitters consume the plan and do not reconstruct Laravel rules.
 */
import type { ActionName, PropertyName, RouteParameterName, RoutePath, ResourceName } from './names';
import { createActionName, createResourceName, createRouteParameterName, createRoutePath, deriveRouteConstantKey } from './names';
import type { RouteResourceRegistration } from './route';
import type { Sequence } from './collections';
import type { RouteDeclarationEvidence } from './routeDeclarationEvidence';

export type RouteResourceAction =
  | 'index' | 'create' | 'store' | 'show' | 'edit' | 'update' | 'destroy';

export type ApiResourceAction = Exclude<RouteResourceAction, 'create' | 'edit'>;
export type RouteResourceMode = 'resource' | 'apiResource' | 'singleton' | 'apiSingleton';

export type ApiResourceHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RouteResourceActionPlan {
  readonly action: ActionName;
  readonly method: ApiResourceHttpMethod;
  readonly path: RoutePath;
  /** Target-runtime path and stable constant identity are resolved with the action plan upstream. */
  readonly runtimePath: RoutePath;
  readonly constantKey: string;
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
  readonly contractVersion: 3;
  readonly input: 'laravel_route_resource_registration' | 'laravel_route_resource_declaration';
  readonly plan: RouteResourceFlowPlan;
  readonly resolution: 'resource_action_relation_closure';
  readonly target: 'nextjs_typescript_route_surface';
  readonly closed: true;
}

/** Existing canonical route declaration evidence is the source contract for resource resolution. */
export interface RouteResourceDeclarationInput {
  readonly kind: 'route_resource_declaration_input';
  readonly mode: RouteResourceMode;
  readonly declaration: RouteDeclarationEvidence;
}

export interface RouteResourceFlowAuthority {
  readonly kind: 'route_resource_flow_authority';
  readonly contractVersion: 4;
  readonly closed: true;
  /** Resolve canonical declaration evidence into a complete resource plan; callers must not precompute resource identity or registration. */
  readonly resolveDeclaration: (input: RouteResourceDeclarationInput) => RouteResourceFlowJudgment;
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

const exactResourceName = (value: string): readonly string[] =>
  RESOURCE_NAME_EXACT_KNOWLEDGE.filter(rule => rule.input === value).map(rule => rule.output);

const suffixResourceName = (value: string): readonly string[] =>
  RESOURCE_NAME_SUFFIX_KNOWLEDGE.filter(rule => rule.pattern.test(value)).map(rule => rule.transform(value));

const singularizeLaravelResourceNameImpl = (value: string): string => {
  const lower = value.toLowerCase();
  const exact = exactResourceName(lower);
  const suffix = suffixResourceName(lower);
  return exact[0] ?? suffix[0] ?? lower;
};

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

const knownAction = (value: ActionName): readonly RouteResourceAction[] =>
  RESOURCE_ACTION_KNOWLEDGE
    .filter(knowledge => knowledge.action === value.value.value)
    .map(knowledge => knowledge.action);

const actionNames = (registration: RouteResourceRegistration): readonly RouteResourceAction[] =>
  Object.freeze(sequenceToArray(registration.only).flatMap(knownAction));

const exceptNames = (registration: RouteResourceRegistration): readonly RouteResourceAction[] =>
  Object.freeze(sequenceToArray(registration.except).flatMap(knownAction));

const capabilityValue = (
  mode: RouteResourceMode,
  registration: RouteResourceRegistration,
  capability: ResourceActionKnowledge['capability'],
): boolean => {
  const modeSupportsCreation = ['resource', 'apiResource'].includes(mode);
  const modeSupportsDestruction = ['resource', 'apiResource'].includes(mode);
  const capabilityKnowledge = [
    { capability: 'always', enabled: true },
    { capability: 'creatable', enabled: modeSupportsCreation || registration.creatable.value },
    { capability: 'destroyable', enabled: modeSupportsDestruction || registration.destroyable.value },
  ];
  return capabilityKnowledge
    .filter(entry => entry.capability === capability)
    .some(entry => entry.enabled);
};

const actionAllowed = (registration: RouteResourceRegistration, knowledge: ResourceActionKnowledge): boolean => {
  const selected = actionNames(registration);
  return selected.length === 0 || selected.includes(knowledge.action);
};

const actionExcluded = (registration: RouteResourceRegistration, knowledge: ResourceActionKnowledge): boolean =>
  exceptNames(registration).includes(knowledge.action);

const actionsOf = (registration: RouteResourceRegistration, mode: RouteResourceMode): readonly ResourceActionKnowledge[] =>
  Object.freeze(RESOURCE_ACTION_KNOWLEDGE.filter(knowledge =>
    knowledge.modes.includes(mode)
    && actionAllowed(registration, knowledge)
    && !actionExcluded(registration, knowledge)
    && capabilityValue(mode, registration, knowledge.capability),
  ));

const resourceSegments = (rawResourcePath: string): readonly string[] =>
  rawResourcePath.replace(/^\/+|\/+$/g, '').split('.').filter(segment => segment.length > 0);

export interface ResolveApiResourceFlowInput {
  readonly mode?: RouteResourceMode;
  readonly declarationPath: RoutePath;
  readonly prefix: readonly RoutePath[];
  readonly resource: ResourceName;
  readonly registration: RouteResourceRegistration;
}

const lastValue = <T>(values: readonly T[], fallback: T): T => values.at(-1) ?? fallback;

const parameterPath = (segments: readonly string[], parameters: readonly RouteParameterName[]): readonly string[] =>
  segments.map((segment, index) => `${segment}/{${parameters[index].value.value}}`);

/**
 * Resolves Laravel apiResource declaration semantics before any dumb emitter.
 * Nested resources use dot notation (`photos.comments`) and produce the
 * canonical parent/child URI parameters.
 */
export const resolveApiResourceFlowJudgment = (input: ResolveApiResourceFlowInput): RouteResourceFlowJudgment => {
  const segments = resourceSegments(input.declarationPath.value.value);
  const parameterNames = Object.freeze(segments.map(segment => createRouteParameterName(routeResourceFlowOperations.singularizeLaravelResourceName(segment))));
  const prefixSegments = input.prefix.map(item => item.value.value).filter((segment, index, segments) => !(index === 1 && segments[0] === 'api' && segment === 'api'));
  const prefix = prefixSegments.join('/');
  const parentSegments = parameterPath(segments.slice(0, Math.max(segments.length - 1, 0)), parameterNames);
  const leafSegment = lastValue(segments, input.resource.value.value);
  const baseSegments = Object.freeze([...parentSegments, leafSegment]);
  const basePath = `/${[prefix, ...baseSegments].filter(segment => segment.length > 0).join('/')}`;
  const leafParameter = lastValue(parameterNames, createRouteParameterName(routeResourceFlowOperations.singularizeLaravelResourceName(input.resource.value.value)));
  const shallowPath = `/${[prefix, leafSegment].filter(segment => segment.length > 0).join('/')}/{${leafParameter.value.value}}`;
  const nestedPath = `${basePath}/{${leafParameter.value.value}}`;
  const itemPath = input.registration.shallow.value ? shallowPath : nestedPath;
  const collectionPath = createRoutePath(basePath);
  const item = createRoutePath(itemPath);
  const mode = input.mode ?? 'apiResource';
  const selected = actionsOf(input.registration, mode);
  const parameters = Object.freeze({
    absent: Object.freeze([]),
    leaf: input.registration.shallow.value ? Object.freeze([leafParameter]) : Object.freeze([...parameterNames]),
  });
  const plan = Object.freeze(selected.flatMap(knowledge => knowledge.methods.map(method => {
    const singleton = mode === 'singleton' || mode === 'apiSingleton';
    const hasLeafParameter = knowledge.parameter === 'leaf' && !singleton;
    const base = hasLeafParameter ? item : collectionPath;
    const path = createRoutePath(`${base.value.value}${knowledge.suffix}`);
    return {
      action: createActionName(knowledge.action),
      method,
      path,
      runtimePath: createRoutePath(path.value.value.replace(/\{([^}]+)\}/g, ':$1')),
      constantKey: deriveRouteConstantKey(path),
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
    contractVersion: 3,
    input: 'laravel_route_resource_registration',
    plan: planResult,
    resolution: 'resource_action_relation_closure',
    target: 'nextjs_typescript_route_surface',
    closed: true,
  });
}

const resolveRouteResourceFlowJudgmentImpl = (
  input: ResolveApiResourceFlowInput & { readonly mode: RouteResourceMode },
): RouteResourceFlowJudgment => resolveApiResourceFlowJudgment(input);

const resolveRouteResourceFlowImpl = (
  input: ResolveApiResourceFlowInput & { readonly mode: RouteResourceMode },
): RouteResourceFlowPlan => routeResourceFlowOperations.resolveRouteResourceFlowJudgment(input).plan;

const resolveApiResourceFlowImpl = (input: ResolveApiResourceFlowInput): RouteResourceFlowPlan =>
  routeResourceFlowOperations.resolveRouteResourceFlowJudgment({ ...input, mode: input.mode ?? 'apiResource' }).plan;

const defaultApiResourceRegistrationImpl = (
  resource: ResourceName,
  controller: RouteResourceRegistration['controller'],
): RouteResourceRegistration => Object.freeze({
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

/** Public runtime operations are a single explicit interface object, not exported function declarations. */
export interface RouteResourceFlowOperationsInterface {
  readonly kind: 'route_resource_flow_operations';
  readonly contractVersion: 1;
  readonly singularizeLaravelResourceName: (value: string) => string;
  readonly resolveRouteResourceFlowJudgment: (input: ResolveApiResourceFlowInput & { readonly mode: RouteResourceMode }) => RouteResourceFlowJudgment;
  readonly resolveRouteResourceFlow: (input: ResolveApiResourceFlowInput & { readonly mode: RouteResourceMode }) => RouteResourceFlowPlan;
  readonly resolveApiResourceFlow: (input: ResolveApiResourceFlowInput) => RouteResourceFlowPlan;
  readonly defaultApiResourceRegistration: (resource: ResourceName, controller: RouteResourceRegistration['controller']) => RouteResourceRegistration;
}

export const routeResourceFlowOperations: RouteResourceFlowOperationsInterface = Object.freeze({
  kind: 'route_resource_flow_operations',
  contractVersion: 1,
  singularizeLaravelResourceName: singularizeLaravelResourceNameImpl,
  resolveRouteResourceFlowJudgment: resolveRouteResourceFlowJudgmentImpl,
  resolveRouteResourceFlow: resolveRouteResourceFlowImpl,
  resolveApiResourceFlow: resolveApiResourceFlowImpl,
  defaultApiResourceRegistration: defaultApiResourceRegistrationImpl,
});
const consSequence = <T>(head: T, tail: Sequence<T>): Sequence<T> =>
  Object.freeze({ kind: 'cons', head, tail });

const sequenceFromValues = <T>(values: readonly T[]): Sequence<T> =>
  values.reduceRight<Sequence<T>>((tail, head) => consSequence(head, tail), emptySequence<T>());

const resourceRegistrationFromEvidence = (
  resource: ResourceName,
  evidence: RouteDeclarationEvidence['resource'],
): RouteResourceRegistration => {
  const defaults = routeResourceFlowOperations.defaultApiResourceRegistration(resource, { kind: 'framework_convention' });
  const only = evidence.actionFilter.kind === 'only'
    ? sequenceFromValues(evidence.actionFilter.actions.map(createActionName))
    : emptySequence<ActionName>();
  const except = evidence.actionFilter.kind === 'except'
    ? sequenceFromValues(evidence.actionFilter.actions.map(createActionName))
    : emptySequence<ActionName>();
  const registration: RouteResourceRegistration = {
    ...defaults,
    only,
    except,
    shallow: { kind: 'truth_value', value: evidence.shallow },
    scoped: { kind: 'truth_value', value: evidence.scoped },
    creatable: { kind: 'truth_value', value: evidence.creatable },
    destroyable: { kind: 'truth_value', value: evidence.destroyable },
  };
  return Object.freeze(registration);
};

/** Resolve the declaration-level evidence before scanner execution or route emission. */
export const resolveRouteResourceDeclarationJudgment = (
  input: RouteResourceDeclarationInput,
): RouteResourceFlowJudgment => {
  const rawPath = input.declaration.path.replace(/^\/+|\/+$/g, '');
  const resource = createResourceName(rawPath);
  const prefix = Object.freeze([
    createRoutePath('api'),
    ...input.declaration.prefix.map(createRoutePath),
  ]);
  return routeResourceFlowOperations.resolveRouteResourceFlowJudgment({
    mode: input.mode,
    declarationPath: createRoutePath(input.declaration.path),
    prefix,
    resource,
    registration: resourceRegistrationFromEvidence(resource, input.declaration.resource),
  });
};

/** Default upstream authority; scanner executors receive these operations through their contract. */
export const routeResourceFlowAuthority: RouteResourceFlowAuthority = Object.freeze({
  kind: 'route_resource_flow_authority',
  contractVersion: 4,
  closed: true,
  resolveDeclaration: resolveRouteResourceDeclarationJudgment,
});
