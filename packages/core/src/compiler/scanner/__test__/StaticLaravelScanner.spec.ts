import { describe, test, expect } from 'vitest';
import path from 'node:path';
import { manifestBuilder, createLaravelSourceProjectIdentity } from '../../../index';

describe('Canonical upstream manifest producer', () => {
  test('builds the fixture manifest through ManifestBuilderInterface', async () => {
    const fixturePath = path.resolve(__dirname, '../../../../../../packages/sdk/tests/fixtures');
    const sourceProject = createLaravelSourceProjectIdentity(fixturePath);
    const manifest = await manifestBuilder.build(sourceProject);

    expect(manifest.version).toBeDefined();
    expect(manifest.routes).toBeDefined();
    expect(manifest.resources).toBeDefined();
    expect(manifest.models).toBeDefined();
    expect(manifest.requestTypes).toBeDefined();
    expect(manifest.semanticTypes).toBeDefined();
  });
});
