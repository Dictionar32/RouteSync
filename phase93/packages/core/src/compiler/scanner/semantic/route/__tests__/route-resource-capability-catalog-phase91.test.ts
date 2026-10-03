import { strict as assert } from 'node:assert';
import { RESOURCE_CAPABILITY_CATALOG, RESOURCE_CREATION_BY_MODE, RESOURCE_DESTRUCTION_BY_MODE } from '../routeResourceCapabilityCatalog';

describe('phase 91 resource capability catalog', () => {
  it('materializes Laravel resource knowledge as profiles instead of mode branches', () => {
    assert.deepEqual(
      RESOURCE_CAPABILITY_CATALOG.resource.actions.map(action => action.value.value),
      ['index', 'create', 'store', 'show', 'edit', 'update', 'destroy'],
    );
    assert.deepEqual(
      RESOURCE_CAPABILITY_CATALOG.api_resource.actions.map(action => action.value.value),
      ['index', 'store', 'show', 'update', 'destroy'],
    );
    assert.deepEqual(
      RESOURCE_CAPABILITY_CATALOG.singleton.actions.map(action => action.value.value),
      ['show', 'edit', 'update'],
    );
    assert.deepEqual(
      RESOURCE_CAPABILITY_CATALOG.api_singleton.actions.map(action => action.value.value),
      ['show', 'update'],
    );
  });

  it('keeps singleton creation and destruction as independent capabilities', () => {
    assert.deepEqual(RESOURCE_CREATION_BY_MODE.singleton.present, { kind: 'creatable' });
    assert.deepEqual(RESOURCE_DESTRUCTION_BY_MODE.singleton.present, { kind: 'destroyable' });
    assert.deepEqual(RESOURCE_CREATION_BY_MODE.resource.present, { kind: 'not_creatable' });
    assert.deepEqual(RESOURCE_DESTRUCTION_BY_MODE.resource.present, { kind: 'not_destroyable' });
  });

  it('does not encode capability semantics by array position', () => {
    const capabilityKey = (capability: typeof RESOURCE_CAPABILITY_CATALOG.resource.capabilities[number]): string => {
      const handlers: Readonly<Record<typeof capability.kind, (value: typeof capability) => string>> = Object.freeze({
        action: value => value.action.value.value,
        creatable_singleton: value => value.kind,
        destroyable_singleton: value => value.kind,
      });
      return handlers[capability.kind](capability);
    };
    const original = RESOURCE_CAPABILITY_CATALOG.resource.capabilities.map(capabilityKey);
    const reordered = [...RESOURCE_CAPABILITY_CATALOG.resource.capabilities].reverse().map(capabilityKey);
    assert.deepEqual(new Set(original), new Set(reordered));
  });
});
