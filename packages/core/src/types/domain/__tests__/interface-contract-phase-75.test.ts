import type {
  FrontendConfiguration,
  PageMetaEntry,
  PagePropEntry,
  RouteManifest,
} from '../base';
import type { PageValue } from '../pageValues';

describe('Phase 75 page value contracts', () => {
  it('replaces unknown page values with a recursive semantic ADT', () => {
    const value: PageValue = {
      kind: 'object',
      entries: [
        { key: 'user', value: { kind: 'string', value: 'lutfi' } },
        { key: 'items', value: { kind: 'list', items: [] } },
      ],
    };

    expect(value.kind).toBe('object');
  });

  it('requires PagePropEntry and PageMetaEntry to carry PageValue', () => {
    const prop: PagePropEntry = { key: 'user', value: { kind: 'boolean', value: true } };
    const meta: PageMetaEntry = { key: 'title', value: { kind: 'string', value: 'Shop' } };

    expect(prop.value.kind).toBe('boolean');
    expect(meta.value.kind).toBe('string');
  });

  it('models frontend absence explicitly instead of null', () => {
    const absent: FrontendConfiguration = { kind: 'disabled' };
    const manifestFrontend: RouteManifest['frontend'] = absent;

    expect(manifestFrontend.kind).toBe('disabled');
  });
});
