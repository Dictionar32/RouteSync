import type { EnumName, ModelName, ClassName } from '../../../../types/upstream/names';
import { flatMapPresence, fromOptional, mapPresence, type Presence } from '../../../../types/upstream/presence';
import type { RouteBindingScoping, ResolvedRouteBindingContract, RouteActionParameterContract } from '../../../../types/upstream/routeBindingResolution';
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
  const type: Presence<ClassName> = mapPresence(fromOptional(parameter), value => value.type);
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
  if (type.kind === 'absent') return { kind: 'absent' };
  const model = fromOptional(catalog.models.get(identityClassKey(type.value)));
  return model;
}

function resolveEnumWhenNoModel(model: Presence<ModelName>, type: Presence<ClassName>, catalog: SemanticIdentityCatalog): Presence<EnumName> {
  if (model.kind === 'present' || type.kind === 'absent') return { kind: 'absent' };
  const enumName = fromOptional(catalog.enums.get(identityClassKey(type.value)));
  return enumName;
}

function resolveWithTrashed(model: Presence<ModelName>, withTrashed: RouteBindingContract['withTrashed']): RouteBindingContract['withTrashed'] {
  if (model.kind === 'present' && withTrashed.kind === 'enabled') return { kind: 'enabled' };
  return { kind: 'disabled' };
}

function resolveTarget(model: Presence<ModelName>, enumName: Presence<EnumName>):
  | Pick<Extract<ResolvedRouteBindingContract, { kind: 'implicit_model' }>, 'kind' | 'model' | 'enum'>
  | Pick<Extract<ResolvedRouteBindingContract, { kind: 'implicit_enum' }>, 'kind' | 'model' | 'enum'>
  | Pick<Extract<ResolvedRouteBindingContract, { kind: 'parameter' }>, 'kind' | 'model' | 'enum'> {
  if (model.kind === 'present') return { kind: 'implicit_model', model: { kind: 'present', value: model.value }, enum: { kind: 'absent' } };
  if (enumName.kind === 'present') return { kind: 'implicit_enum', model: { kind: 'absent' }, enum: { kind: 'present', value: enumName.value } };
  return { kind: 'parameter', model: { kind: 'absent' }, enum: { kind: 'absent' } };
}

function resolveBindingScoping(
  binding: RouteBindingContract,
  targetKind: ResolvedRouteBindingContract['kind'],
  catalog: SemanticIdentityCatalog,
  bindingScope: RouteBindingSemanticInput['bindingScope'],
): RouteBindingScoping {
  const parentParameter = binding.parent.kind === 'present'
    ? fromOptional(catalog.actionParameters.get(identityParameterKey(binding.parent.value)))
    : { kind: 'absent' as const };
  const parentModel = flatMapPresence(parentParameter, value => resolveModel(value.type, catalog));
  if (targetKind !== 'implicit_model' || parentModel.kind !== 'present') return { kind: 'none' };
  if (bindingScope === 'without_scoped') return { kind: 'disabled' };
  if (bindingScope === 'scoped') return { kind: 'scoped', reason: 'scope_bindings' };
  if (binding.key.kind === 'custom') return { kind: 'scoped', reason: 'custom_key' };
  return { kind: 'none' };
}
