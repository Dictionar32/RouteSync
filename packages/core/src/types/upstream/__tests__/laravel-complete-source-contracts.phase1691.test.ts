import { laravelRouteSourceSelectionAuthority } from '../laravelRouteSourceSelection';
import { sourceFileIdentityFactory, stringValue } from '../names';
import { describe, expect, test } from 'vitest';
import path from 'node:path';
import { manifestBuilderOperationPreparation } from '../../../compiler/scanner/wiring/upstreamManifestBuilder';
import { createLaravelSourceProjectIdentity } from '../sourceProjectIdentity';
import type { Sequence } from '../collections';
import { createNotConnectedControllerInventoryReceipt } from '../../../compiler/scanner/__test__/createNotConnectedControllerInventoryReceipt';

const fixtureRoot = path.resolve(__dirname, '../../../../../../examples/ecommerce-shop-source');

const sequenceToArray = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  items.kind === 'empty' ? output : sequenceToArray(items.tail, [...output, items.head]);

describe('Phase 1691 complete Laravel source contract preservation', () => {
  test('retains migration, schema, DTO, middleware, and attribute contracts after source-model projection', async () => {
    const sourceProject = createLaravelSourceProjectIdentity.create(sourceFileIdentityFactory.create(stringValue.create(fixtureRoot)));
    const receipt = await createNotConnectedControllerInventoryReceipt(sourceProject);
    const manifestJudgment = await manifestBuilderOperationPreparation.prepare({ kind: 'manifest_builder_input', invocationInventoryReceipt: receipt, routeSelection: laravelRouteSourceSelectionAuthority.defaultIntent() }).build();
    if (manifestJudgment.kind !== 'manifest_builder_complete') throw new Error(`Fixture manifest blocked: ${manifestJudgment.projection.kind}`);
    const manifest = manifestJudgment.manifest;
    const { contracts } = manifest.sourceModel;

    expect(sequenceToArray(contracts.models).length).toBeGreaterThan(0);
    expect(sequenceToArray(contracts.routes).length).toBeGreaterThan(0);
    expect(sequenceToArray(contracts.migrations).length).toBeGreaterThan(0);
    expect(sequenceToArray(contracts.schemas).length).toBeGreaterThan(0);
    expect(sequenceToArray(contracts.dtos).length).toBeGreaterThan(0);
    expect(sequenceToArray(contracts.middlewares).length).toBeGreaterThan(0);
    expect(sequenceToArray(contracts.attributes).length).toBeGreaterThan(0);
  });
});
