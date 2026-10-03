import type { RouteBindingContract } from '../../../../types/upstream/routeBinding';
import type { RouteBindingScoping, ResolvedRouteBindingContract } from '../../../../types/upstream/routeBindingResolution';
import type { Presence } from '../../../../types/upstream/presence';
import type { ModelName } from '../../../../types/upstream/names';
import { fromOptional } from '../../../../types/upstream/presence';

export type BindingTargetPresenceKey = `${Presence<ModelName>['kind']}:${Presence<ModelName>['kind']}`;
export type BindingScopingKey = `${ResolvedRouteBindingContract['kind']}:${Presence<ModelName>['kind']}:${RouteBindingContract['key']['kind']}:${'default' | 'scoped' | 'without_scoped'}`;

export const BINDING_TARGET_KIND_CATALOG: Readonly<Record<BindingTargetPresenceKey, ResolvedRouteBindingContract['kind']>> = Object.freeze({
  'present:absent': 'implicit_model',
  'absent:present': 'implicit_enum',
  'absent:absent': 'parameter',
  'present:present': 'implicit_model',
});

export const BINDING_WITH_TRASHED_CATALOG: Readonly<Record<`${Presence<ModelName>['kind']}:${RouteBindingContract['withTrashed']['kind']}`, RouteBindingContract['withTrashed']>> = Object.freeze({
  'present:enabled': { kind: 'enabled' },
  'present:disabled': { kind: 'disabled' },
  'absent:enabled': { kind: 'disabled' },
  'absent:disabled': { kind: 'disabled' },
});

const scopedRules: ReadonlyArray<readonly [BindingScopingKey, RouteBindingScoping]> = Object.freeze([
  ['implicit_model:present:default:without_scoped', { kind: 'disabled' }],
  ['implicit_model:present:custom:without_scoped', { kind: 'disabled' }],
  ['implicit_model:present:default:scoped', { kind: 'scoped', reason: 'scope_bindings' }],
  ['implicit_model:present:custom:scoped', { kind: 'scoped', reason: 'scope_bindings' }],
  ['implicit_model:present:custom:default', { kind: 'scoped', reason: 'custom_key' }],
]);

export const BINDING_SCOPING_CATALOG: ReadonlyMap<BindingScopingKey, RouteBindingScoping> = new Map(scopedRules);

export function resolveBindingScopingKnowledge(key: BindingScopingKey): RouteBindingScoping {
  const presence = fromOptional(BINDING_SCOPING_CATALOG.get(key));
  const handlers = Object.freeze({
    absent: () => ({ kind: 'none' as const }),
    present: (value: Extract<typeof presence, { kind: 'present' }>) => value.value,
  });
  return handlers[presence.kind](presence as never);
}
