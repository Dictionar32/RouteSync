import type { EnumName, ModelName, ClassName } from '../../../../types/upstream/names';
import { flatMapPresence, fromOptional, mapPresence, type Presence } from '../../../../types/upstream/presence';
import type { RouteBindingScoping, ResolvedRouteBindingContract, RouteActionParameterContract } from '../../../../types/upstream/routeBindingResolution';
import { BINDING_SCOPING_CATALOG, BINDING_TARGET_KIND_CATALOG, BINDING_WITH_TRASHED_CATALOG, resolveBindingScopingKnowledge } from './routeBindingKnowledgeCatalog';
import type { RouteBindingContract } from '../../../../types/upstream/routeBinding';
import { createSemanticIdentityCatalog, identityClassKey, identityParameterKey, type SemanticIdentityCatalog } from '../../../../types/upstream/semanticCatalog';

export interface RouteBindingSemanticInput {
  readonly bindings: readonly RouteBindingContract[];
  readonly actionParameters: readonly RouteActionParameterContract[];
  readonly modelNames: readonly ModelName[];
  readonly bindingScope: 'default' | 'scoped' | 'without_scoped';
  readonly enumNames: readonly EnumName[];
}

export function resolveRouteBindingSemantics(input: RouteBindingSemanticInput): readonly ResolvedRouteBindingContract[] {
  const catalog = createSemanticIdentityCatalog(input);
  return Object.freeze(input.bindings.map(binding => resolveBinding(binding, catalog, input.bindingScope)));
}

function resolveBinding(binding: RouteBindingContract, catalog: SemanticIdentityCatalog, bindingScope: RouteBindingSemanticInput['bindingScope']): ResolvedRouteBindingContract {
  const parameter = catalog.actionParameters.get(identityParameterKey(binding.parameter));
  const type: Presence<ClassName> = flatMapPresence(fromOptional(parameter), value => value.type);
  const model = resolveModel(type, catalog);
  const enumName = resolveEnumWhenNoModel(model, type, catalog);
  const target = resolveTarget(model, enumName);
  return Object.freeze({
    parameter: binding.parameter,
    parent: binding.parent,
    key: binding.key,
    withTrashed: resolveWithTrashed(model, binding.withTrashed),
    ...target,
    scoping: resolveBindingScoping(binding, target.kind, catalog, bindingScope),
  });
}

function resolveModel(type: Presence<ClassName>, catalog: SemanticIdentityCatalog): Presence<ModelName> {
  return flatMapPresence(type, value => fromOptional(catalog.models.get(identityClassKey(value))));
}

function resolveEnumWhenNoModel(model: Presence<ModelName>, type: Presence<ClassName>, catalog: SemanticIdentityCatalog): Presence<EnumName> {
  const candidate = flatMapPresence(type, value => fromOptional(catalog.enums.get(identityClassKey(value))));
  const key = `${model.kind}:${candidate.kind}` as const;
  const handlers = Object.freeze({
    'present:present': () => ({ kind: 'absent' as const }),
    'present:absent': () => ({ kind: 'absent' as const }),
    'absent:present': () => candidate,
    'absent:absent': () => ({ kind: 'absent' as const }),
  } as const);
  return handlers[key]();
}

function resolveWithTrashed(model: Presence<ModelName>, withTrashed: RouteBindingContract['withTrashed']): RouteBindingContract['withTrashed'] {
  return BINDING_WITH_TRASHED_CATALOG[`${model.kind}:${withTrashed.kind}`];
}

function resolveTarget(model: Presence<ModelName>, enumName: Presence<EnumName>) {
  const key = `${model.kind}:${enumName.kind}` as const;
  const builders = Object.freeze({
    'present:absent': () => ({ kind: 'implicit_model' as const, model, enum: { kind: 'absent' as const } }),
    'present:present': () => ({ kind: 'implicit_model' as const, model, enum: { kind: 'absent' as const } }),
    'absent:present': () => ({ kind: 'implicit_enum' as const, model: { kind: 'absent' as const }, enum: enumName }),
    'absent:absent': () => ({ kind: 'parameter' as const, model: { kind: 'absent' as const }, enum: { kind: 'absent' as const } }),
  } as const);
  return builders[key]() as
    | Pick<Extract<ResolvedRouteBindingContract, { kind: 'implicit_model' }>, 'kind' | 'model' | 'enum'>
    | Pick<Extract<ResolvedRouteBindingContract, { kind: 'implicit_enum' }>, 'kind' | 'model' | 'enum'>
    | Pick<Extract<ResolvedRouteBindingContract, { kind: 'parameter' }>, 'kind' | 'model' | 'enum'>;
}

function resolveBindingScoping(
  binding: RouteBindingContract,
  targetKind: ResolvedRouteBindingContract['kind'],
  catalog: SemanticIdentityCatalog,
  bindingScope: RouteBindingSemanticInput['bindingScope'],
): RouteBindingScoping {
  const parentParameter = flatMapPresence(binding.parent, parent => fromOptional(catalog.actionParameters.get(identityParameterKey(parent))));
  const parentModel = flatMapPresence(parentParameter, parameter => resolveModel(parameter.type, catalog));
  const key = `${targetKind}:${parentModel.kind}:${binding.key.kind}:${bindingScope}` as const;
  return resolveBindingScopingKnowledge(key);
}
