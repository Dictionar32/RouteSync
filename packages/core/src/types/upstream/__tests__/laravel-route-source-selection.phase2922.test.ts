import { describe, expect, it } from 'vitest';
import { type SourceFile, sourceFileInventoryFactory, sourceFileIdentityFactory } from '../names';
import type { LaravelRouteSourcePresenceInterface } from '../laravelRouteSourceSelection';
import { phpSourceDocumentReadResultFactory, phpSourceTextFactory } from '../phpSourceFrontendInterface';
import { stringValue } from '../valueObjects';
import { laravelRouteSourcePresenceJudgmentFactory, laravelRouteSourceSelectionAuthority } from '../laravelRouteSourceSelection';
import { laravelDefaultRouteSourceResolution } from '../../../compiler/scanner/upstream/laravelDefaultRouteSourceResolution';
import { createLaravelSourceProjectIdentity } from '../sourceProjectIdentity';

describe('Laravel explicit route-source selection domain operations', () => {
  const presenceWithMissing = (missingPaths: readonly string[]): LaravelRouteSourcePresenceInterface => Object.freeze({
    kind: 'laravel_route_source_presence',
    observe: sourceFile => missingPaths.includes(sourceFile.value.value)
      ? laravelRouteSourcePresenceJudgmentFactory.absent(sourceFile)
      : laravelRouteSourcePresenceJudgmentFactory.present(sourceFile),
  });
  const sourceReader = Object.freeze({
    kind: 'php_source_document_reader' as const,
    closed: true as const,
    contractVersion: 1 as const,
    read: async ({ sourceFile }: { readonly sourceFile: SourceFile }) =>
      phpSourceDocumentReadResultFactory.complete(phpSourceTextFactory.create(stringValue.create('<?php')).bindTo(sourceFile)),
  });
  it('presence evidence owns present and absent continuations', () => {
    const source = sourceFileIdentityFactory.create(stringValue.create('/project/routes/web.php'));
    const present = laravelRouteSourcePresenceJudgmentFactory.present(source);
    const absent = laravelRouteSourcePresenceJudgmentFactory.absent(source);

    expect(present.continueWith({ onPresent: file => file, onAbsent: () => undefined })).toBe(source);
    expect(absent.continueWith({ onPresent: () => undefined, onAbsent: file => file })).toBe(source);
  });

  it('projects explicit source files in their selected order', () => {
    const first = sourceFileIdentityFactory.create(stringValue.create('/project/routes/api.php'));
    const second = sourceFileIdentityFactory.create(stringValue.create('/project/routes/web.php'));
    const selection = laravelRouteSourceSelectionAuthority.explicitFiles(sourceFileInventoryFactory.empty().include(first).include(second));
    expect(selection.selectedSourceFiles().toSourceFiles().map(sourceFile => sourceFile.value.value)).toEqual(['/project/routes/api.php', '/project/routes/web.php']);
  });


  it('resolves default Laravel route sources through the domain operation', () => {
    const project = createLaravelSourceProjectIdentity.create(sourceFileIdentityFactory.create(stringValue.create('/workspace/app')));
    const inventory = laravelRouteSourceSelectionAuthority.defaultIntent().resolveFilesFor(project, laravelDefaultRouteSourceResolution);
    expect(inventory.toSourceFiles().map(sourceFile => sourceFile.value.value)).toEqual([
      '/workspace/app/routes/api.php',
      '/workspace/app/routes/web.php',
    ]);
  });


  it('classifies absent default sources as optional observations through the intent ADT', () => {
    const api = sourceFileIdentityFactory.create(stringValue.create('/project/routes/api.php'));
    const web = sourceFileIdentityFactory.create(stringValue.create('/project/routes/web.php'));
    const selected = sourceFileInventoryFactory.empty().include(api).include(web);
    const judgment = laravelRouteSourceSelectionAuthority.defaultIntent().observeFiles(selected, presenceWithMissing(['/project/routes/web.php']));

    expect(judgment.kind).toBe('laravel_route_source_observation_ready');
    if (judgment.kind === 'laravel_route_source_observation_ready') {
      const observed = judgment.continueWithScannableSources().toSourceFiles().map(file => `laravel_route_source_file_scanned:${file.value.value}`);
      expect(judgment.sourceFiles.map(observation => observation.kind)).toEqual([
        'laravel_route_source_file_scanned',
        'laravel_route_source_file_absent_optional_default',
      ]);
      expect(observed).toEqual([
        'laravel_route_source_file_scanned:/project/routes/api.php',
      ]);
    }
  });

  it('preserves explicit missing-file evidence as a blocked domain judgment', () => {
    const api = sourceFileIdentityFactory.create(stringValue.create('/project/routes/api.php'));
    const selected = sourceFileInventoryFactory.empty().include(api);
    const judgment = laravelRouteSourceSelectionAuthority.explicitIntent(
      laravelRouteSourceSelectionAuthority.explicitFiles(selected),
    ).observeFiles(selected, presenceWithMissing(['/project/routes/api.php']));

    expect(judgment.kind).toBe('laravel_route_scan_blocked');
    if (judgment.kind === 'laravel_route_scan_blocked') {
      expect(judgment.preserveMissingSourceEvidence().toSourceFiles().map(file => file.value.value)).toEqual(['/project/routes/api.php']);
    }
  });


  it('classifies every absent default source using canonical source identity', () => {
    const api = sourceFileIdentityFactory.create(stringValue.create('/project/routes/api.php'));
    const web = sourceFileIdentityFactory.create(stringValue.create('/project/routes/web.php'));
    const console = sourceFileIdentityFactory.create(stringValue.create('/project/routes/console.php'));
    const selected = sourceFileInventoryFactory.empty().include(api).include(web).include(console);
    const judgment = laravelRouteSourceSelectionAuthority.defaultIntent().observeFiles(selected, presenceWithMissing(['/project/routes/web.php', '/project/routes/console.php']));

    expect(judgment.kind).toBe('laravel_route_source_observation_ready');
    expect(judgment.sourceFiles.map(observation => observation.kind)).toEqual([
      'laravel_route_source_file_scanned',
      'laravel_route_source_file_absent_optional_default',
      'laravel_route_source_file_absent_optional_default',
    ]);
    expect(judgment.continueWithScannableSources().kind).toBe('source_file_inventory_entry');
  });

  it('projects no files for an empty explicit selection', () => {
    const selection = laravelRouteSourceSelectionAuthority.explicitFiles(sourceFileInventoryFactory.empty());
    expect(selection.selectedSourceFiles().toSourceFiles()).toEqual([]);
  });

  it('continues a ready source observation through its own domain operation', async () => {
    const api = sourceFileIdentityFactory.create(stringValue.create('/project/routes/api.php'));
    const selected = sourceFileInventoryFactory.empty().include(api);
    const judgment = laravelRouteSourceSelectionAuthority.defaultIntent().observeFiles(selected, presenceWithMissing([]));
    const scan = Object.freeze({
      kind: 'laravel_route_scan_judgment' as const,
      contractVersion: 27 as const,
      sourceFiles: Object.freeze([]),
      artifacts: Object.freeze([]),
    });

    const continued = await judgment.continueToRouteScan(sourceReader, {
      scanReadyObservation: async (observation, readBatch) => {
        expect(observation).toBe(judgment);
        expect(observation.continueWithScannableSources().toSourceFiles()).toEqual([api]);
        expect(readBatch.kind).toBe('php_source_document_read_batch_complete');
        return scan;
      },
    });

    expect(continued).toBe(scan);
  });

  it('continues a blocked source observation without losing its original evidence', async () => {
    const api = sourceFileIdentityFactory.create(stringValue.create('/project/routes/api.php'));
    const selected = sourceFileInventoryFactory.empty().include(api);
    const judgment = laravelRouteSourceSelectionAuthority.explicitIntent(
      laravelRouteSourceSelectionAuthority.explicitFiles(selected),
    ).observeFiles(selected, presenceWithMissing(['/project/routes/api.php']));

    const continued = await judgment.continueToRouteScan(sourceReader, {
      scanReadyObservation: async () => {
        throw new Error('Blocked source evidence must not enter the ready continuation');
      },
    });

    expect(continued.kind).toBe('laravel_route_scan_blocked');
    expect(judgment.kind).toBe('laravel_route_scan_blocked');
    if (judgment.kind === 'laravel_route_scan_blocked') {
      expect(judgment.preserveMissingSourceEvidence().toSourceFiles()).toEqual([api]);
    }
  });

});
