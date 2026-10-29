import { describe, expect, it } from 'vitest';
import { sourceFileIdentityFactory, sourceFileInventoryFactory, stringValue } from '../names';
import { createLaravelSourceProjectIdentity } from '../sourceProjectIdentity';
import { filesystemFailureCodeFactory, filesystemFailureLocationFactory } from '../filesystemFailureInterface';
import {
  laravelControllerSourceDiscoveryBlockerFactory,
  laravelControllerSourceDiscoveryJudgmentFactory,
} from '../laravelControllerInvocationSemanticJudgmentInventoryInterface';

describe('Laravel controller source discovery complete operation', () => {
  const root = sourceFileIdentityFactory.create(stringValue.create('/project/app/Http/Controllers'));
  const sourceProject = createLaravelSourceProjectIdentity.create(root);

  it('continues a complete discovery through its named domain operation', async () => {
    const complete = laravelControllerSourceDiscoveryJudgmentFactory.complete(Object.freeze({
      kind: 'laravel_controller_source_discovery_complete',
      contractVersion: 4,
      sourceProject,
      root,
      sources: sourceFileInventoryFactory.empty(),
    }));

    const result = await complete.continueCompleteDiscovery(judgment => Promise.resolve(judgment));

    expect(result.kind).toBe('laravel_controller_source_discovery_complete');
    expect(result.sources).toBe(complete.sources);
  });

  it('exposes domain operations without publishing the retired generic continuation visitor', () => {
    const complete = laravelControllerSourceDiscoveryJudgmentFactory.complete(Object.freeze({
      kind: 'laravel_controller_source_discovery_complete',
      contractVersion: 4,
      sourceProject,
      root,
      sources: sourceFileInventoryFactory.empty(),
    }));
    const blocked = laravelControllerSourceDiscoveryJudgmentFactory.blocked(Object.freeze({
      kind: 'laravel_controller_source_discovery_blocked',
      contractVersion: 4,
      sourceProject,
      root,
      partialSources: sourceFileInventoryFactory.empty(),
      blocker: laravelControllerSourceDiscoveryBlockerFactory.symbolicLinkEncountered(root),
    }));

    expect(complete).not.toHaveProperty('continueWith');
    expect(blocked).not.toHaveProperty('continueWith');
    expect(complete).toHaveProperty('projectForManifest');
    expect(complete).toHaveProperty('continueCompleteDiscovery');
    expect(blocked).toHaveProperty('projectForManifest');
    expect(blocked).toHaveProperty('continueCompleteDiscovery');
  });

  it('includes a discovered source without changing project identity or root evidence', () => {
    const source = sourceFileIdentityFactory.create(stringValue.create('/project/app/Http/Controllers/HealthController.php'));
    const complete = laravelControllerSourceDiscoveryJudgmentFactory.complete(Object.freeze({
      kind: 'laravel_controller_source_discovery_complete',
      contractVersion: 4,
      sourceProject,
      root,
      sources: sourceFileInventoryFactory.empty(),
    }));

    const next = complete.includeSource(source);

    expect(next.kind).toBe('laravel_controller_source_discovery_complete');
    expect(next.sourceProject).toBe(sourceProject);
    expect(next.root).toBe(root);
    expect(next.sources.toSourceFiles()).toContain(source);
  });

  it('turns a complete inventory into blocked evidence without losing already discovered sources', () => {
    const source = sourceFileIdentityFactory.create(stringValue.create('/project/app/Http/Controllers/HealthController.php'));
    const complete = laravelControllerSourceDiscoveryJudgmentFactory.complete(Object.freeze({
      kind: 'laravel_controller_source_discovery_complete',
      contractVersion: 4,
      sourceProject,
      root,
      sources: sourceFileInventoryFactory.empty().include(source),
    }));
    const blocker = laravelControllerSourceDiscoveryBlockerFactory.symbolicLinkEncountered(root);

    const blocked = complete.block(blocker);

    expect(blocked.kind).toBe('laravel_controller_source_discovery_blocked');
    expect(blocked.sourceProject).toBe(sourceProject);
    expect(blocked.root).toBe(root);
    expect(blocked.partialSources).toBe(complete.sources);
    expect(blocked.blocker).toBe(blocker);
  });

  it('settles filesystem failure through one upstream-owned domain operation', () => {
    const partialSource = sourceFileIdentityFactory.create(stringValue.create('/project/app/Http/Controllers/HealthController.php'));
    const partialSources = sourceFileInventoryFactory.empty().include(partialSource);
    const location = filesystemFailureLocationFactory.directory(root);
    const failure = Object.freeze({ kind: 'filesystem_failure_evidence' });
    const blocked = laravelControllerSourceDiscoveryJudgmentFactory.blockedByFilesystemFailure({
      sourceProject,
      root,
      directory: root,
      partialSources,
      failureCode: filesystemFailureCodeFactory.missing(),
      location,
      failure,
    });

    expect(blocked.kind).toBe('laravel_controller_source_discovery_blocked');
    expect(blocked.sourceProject).toBe(sourceProject);
    expect(blocked.root).toBe(root);
    expect(blocked.partialSources).toBe(partialSources);
    expect(blocked.blocker).toHaveProperty('failure', failure);
  });

  it('projects complete discovery into the fixed CLI manifest contract without generic handlers', () => {
    const complete = laravelControllerSourceDiscoveryJudgmentFactory.complete(Object.freeze({
      kind: 'laravel_controller_source_discovery_complete',
      contractVersion: 4,
      sourceProject,
      root,
      sources: sourceFileInventoryFactory.empty(),
    }));

    const projection = complete.projectForManifest();

    expect(projection.kind).toBe('laravel_controller_source_discovery_manifest_complete');
    expect(projection.sourceProject).toBe(sourceProject);
    expect(projection.root).toBe(root);
    expect(projection.sources).toBe(complete.sources);
    expect(projection.preserveCompleteJudgment()).toBe(complete);
    expect(projection.preserveCompleteJudgment().sources).toBe(complete.sources);
  });

  it('projects blocked discovery while retaining blocker and partial inventory identity', () => {
    const partialSource = sourceFileIdentityFactory.create(stringValue.create('/project/app/Http/Controllers/HealthController.php'));
    const partialSources = sourceFileInventoryFactory.empty().include(partialSource);
    const blocker = laravelControllerSourceDiscoveryBlockerFactory.symbolicLinkEncountered(root);
    const blocked = laravelControllerSourceDiscoveryJudgmentFactory.blocked(Object.freeze({
      kind: 'laravel_controller_source_discovery_blocked',
      contractVersion: 4,
      sourceProject,
      root,
      partialSources,
      blocker,
    }));

    const projection = blocked.projectForManifest();

    expect(projection.kind).toBe('laravel_controller_source_discovery_manifest_blocked');
    expect(projection.sourceProject).toBe(sourceProject);
    expect(projection.root).toBe(root);
    expect(projection.partialSources).toBe(partialSources);
    expect(projection.blocker).toBe(blocker);
    expect(projection.preserveBlockedJudgment()).toBe(blocked);
  });

  it('preserves the original blocked judgment without invoking complete continuation', async () => {
    const blocked = laravelControllerSourceDiscoveryJudgmentFactory.blocked(Object.freeze({
      kind: 'laravel_controller_source_discovery_blocked',
      contractVersion: 4,
      sourceProject,
      root,
      partialSources: sourceFileInventoryFactory.empty(),
      blocker: laravelControllerSourceDiscoveryBlockerFactory.symbolicLinkEncountered(root),
    }));
    let continuationInvoked = false;

    const result = await blocked.continueCompleteDiscovery(async () => {
      continuationInvoked = true;
      return laravelControllerSourceDiscoveryJudgmentFactory.complete(Object.freeze({
        kind: 'laravel_controller_source_discovery_complete',
        contractVersion: 4,
        sourceProject,
        root,
        sources: sourceFileInventoryFactory.empty(),
      }));
    });

    expect(result).toBe(blocked);
    expect(continuationInvoked).toBe(false);
    expect(result.kind).toBe('laravel_controller_source_discovery_blocked');
    expect(result.blocker).toBe(blocked.blocker);
    expect(result.partialSources).toBe(blocked.partialSources);
  });
});
