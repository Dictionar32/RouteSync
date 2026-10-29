import { describe, expect, it } from 'vitest';
import { sourceFileIdentityFactory, sourceFileInventoryFactory, stringValue } from '../names';
import { createLaravelSourceProjectIdentity } from '../sourceProjectIdentity';
import { laravelControllerSourceDiscoveryBlockerFactory } from '../laravelControllerInvocationSemanticJudgmentInventoryInterface';

const root = sourceFileIdentityFactory.create(stringValue.create('/project/app/Http/Controllers'));
const sourceProject = createLaravelSourceProjectIdentity.create(root);
const partialSource = sourceFileIdentityFactory.create(stringValue.create('/project/app/Http/Controllers/HealthController.php'));
const partialSources = sourceFileInventoryFactory.empty().include(partialSource);
const originalFailure = Object.freeze({ code: 'EACCES', detail: 'original filesystem rejection evidence' });
const settlement = Object.freeze({ sourceProject, root, partialSources });

describe('Laravel controller source discovery blocker operations', () => {
  it('exposes immutable blocker-owned settlement operations without mutable staging', () => {
    const blockers = [
      laravelControllerSourceDiscoveryBlockerFactory.rootMissing(root, originalFailure),
      laravelControllerSourceDiscoveryBlockerFactory.directoryMissing(root, originalFailure),
      laravelControllerSourceDiscoveryBlockerFactory.pathNotDirectory(root, originalFailure),
      laravelControllerSourceDiscoveryBlockerFactory.directoryUnreadable(root, originalFailure),
      laravelControllerSourceDiscoveryBlockerFactory.symbolicLinkEncountered(root),
      laravelControllerSourceDiscoveryBlockerFactory.failureCodeUnrecognized(root, originalFailure),
    ];

    expect(blockers.every(Object.isFrozen)).toBe(true);
    expect(blockers.every(blocker => typeof blocker.blockDiscovery === 'function')).toBe(true);
    expect(blockers.map(blocker => blocker.blockDiscovery(settlement).blocker)).toEqual(blockers);
  });
  it('settles a missing-root blocker into a blocked discovery judgment', () => {
    const blocker = laravelControllerSourceDiscoveryBlockerFactory.rootMissing(root, originalFailure);
    const result = blocker.blockDiscovery(settlement);

    expect(result.kind).toBe('laravel_controller_source_discovery_blocked');
    expect(result.blocker).toBe(blocker);
    expect(result.blocker.kind).toBe('controller_source_discovery_root_missing');
    expect(result.blocker).toHaveProperty('failure', originalFailure);
    expect(result.sourceProject).toBe(sourceProject);
    expect(result.root).toBe(root);
    expect(result.partialSources).toBe(partialSources);
  });

  it('settles a missing-directory blocker without losing partial inventory', () => {
    const blocker = laravelControllerSourceDiscoveryBlockerFactory.directoryMissing(root, originalFailure);
    const result = blocker.blockDiscovery(settlement);

    expect(result.blocker).toBe(blocker);
    expect(result.blocker.kind).toBe('controller_source_discovery_directory_missing');
    expect(result.partialSources.toSourceFiles()).toContain(partialSource);
  });

  it('settles a non-directory blocker through its domain operation', () => {
    const blocker = laravelControllerSourceDiscoveryBlockerFactory.pathNotDirectory(root, originalFailure);
    expect(blocker.blockDiscovery(settlement).blocker).toBe(blocker);
  });

  it('settles an unreadable-directory blocker through its domain operation', () => {
    const blocker = laravelControllerSourceDiscoveryBlockerFactory.directoryUnreadable(root, originalFailure);
    expect(blocker.blockDiscovery(settlement).blocker).toBe(blocker);
  });

  it('settles a symbolic-link blocker through its domain operation', () => {
    const blocker = laravelControllerSourceDiscoveryBlockerFactory.symbolicLinkEncountered(root);
    const result = blocker.blockDiscovery(settlement);

    expect(result.blocker).toBe(blocker);
    expect(result.blocker.kind).toBe('controller_source_discovery_symbolic_link_encountered');
  });

  it('preserves an unrecognized filesystem failure through the domain operation', () => {
    const blocker = laravelControllerSourceDiscoveryBlockerFactory.failureCodeUnrecognized(root, originalFailure);
    const result = blocker.blockDiscovery(settlement);

    expect(result.blocker).toBe(blocker);
    expect(result.blocker.kind).toBe('controller_source_discovery_failure_code_unrecognized');
    expect(result.blocker).toHaveProperty('failure', originalFailure);
  });
});
