import { describe, test, expect } from 'vitest';
import path from 'node:path';
import { manifestBuilderOperationPreparation, createLaravelSourceProjectIdentity } from '../../../index';
import { createNotConnectedControllerInventoryReceipt } from './createNotConnectedControllerInventoryReceipt';

describe('Canonical upstream manifest producer', () => {
  test('builds the fixture manifest through ManifestBuilderInterface', async () => {
    const fixturePath = path.resolve(__dirname, '../../../../../../packages/sdk/tests/fixtures');
    const sourceProject = createLaravelSourceProjectIdentity(fixturePath);
    const receipt = await createNotConnectedControllerInventoryReceipt(sourceProject);
    const manifestJudgment = await manifestBuilderOperationPreparation.prepare({ kind: 'manifest_builder_input', invocationInventoryReceipt: receipt, routeSelection: { kind: 'laravel_route_source_selection_default' } }).build();
    if (manifestJudgment.kind !== 'manifest_builder_complete') throw new Error(`Fixture manifest blocked: ${manifestJudgment.projection.kind}`);
    const manifest = manifestJudgment.manifest;

    expect(manifest.version).toBeDefined();
    expect(manifest.routes).toBeDefined();
    expect(manifest.resources).toBeDefined();
    expect(manifest.models).toBeDefined();
    expect(manifest.requestTypes).toBeDefined();
    expect(manifest.semanticTypes).toBeDefined();
  });
});
