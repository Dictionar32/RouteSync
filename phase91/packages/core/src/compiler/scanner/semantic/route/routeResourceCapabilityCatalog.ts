import { createActionName } from '../../../../types/upstream/names';
import type { ResourceRegistrationMode } from '../../../../types/upstream/routeResourceMode';
import type { ResourceActionProfile } from '../../../../types/upstream/routeResourceModel';

const actions = (values: readonly string[]) => Object.freeze(values.map(createActionName));
const actionCapabilities = (values: readonly string[]) => Object.freeze(
  values.map(value => Object.freeze({ kind: 'action' as const, action: createActionName(value) })),
);

export const RESOURCE_CAPABILITY_CATALOG: Readonly<Record<ResourceRegistrationMode['kind'], ResourceActionProfile>> = Object.freeze({
  resource: Object.freeze({
    actions: actions(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy']),
    capabilities: actionCapabilities(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy']),
    withTrashedDefaults: actions(['show', 'edit', 'update']),
  }),
  api_resource: Object.freeze({
    actions: actions(['index', 'store', 'show', 'update', 'destroy']),
    capabilities: actionCapabilities(['index', 'store', 'show', 'update', 'destroy']),
    withTrashedDefaults: actions(['show', 'update']),
  }),
  singleton: Object.freeze({
    actions: actions(['show', 'edit', 'update']),
    capabilities: actionCapabilities(['show', 'edit', 'update']),
    withTrashedDefaults: actions(['show', 'edit', 'update']),
  }),
  api_singleton: Object.freeze({
    actions: actions(['show', 'update']),
    capabilities: actionCapabilities(['show', 'update']),
    withTrashedDefaults: actions(['show', 'update']),
  }),
});

export const RESOURCE_CREATION_BY_MODE = Object.freeze({
  resource: Object.freeze({ absent: { kind: 'not_creatable' as const }, present: { kind: 'not_creatable' as const } }),
  api_resource: Object.freeze({ absent: { kind: 'not_creatable' as const }, present: { kind: 'not_creatable' as const } }),
  singleton: Object.freeze({ absent: { kind: 'not_creatable' as const }, present: { kind: 'creatable' as const } }),
  api_singleton: Object.freeze({ absent: { kind: 'not_creatable' as const }, present: { kind: 'creatable' as const } }),
});

export const RESOURCE_DESTRUCTION_BY_MODE = Object.freeze({
  resource: Object.freeze({ absent: { kind: 'not_destroyable' as const }, present: { kind: 'not_destroyable' as const } }),
  api_resource: Object.freeze({ absent: { kind: 'not_destroyable' as const }, present: { kind: 'not_destroyable' as const } }),
  singleton: Object.freeze({ absent: { kind: 'not_destroyable' as const }, present: { kind: 'destroyable' as const } }),
  api_singleton: Object.freeze({ absent: { kind: 'not_destroyable' as const }, present: { kind: 'destroyable' as const } }),
});
