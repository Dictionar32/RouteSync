import { describe, expect, it } from 'vitest';
import {
  routeSyncStandaloneCompositionGuard,
  routeSyncStandaloneCompositionLoader,
  ROUTESYNC_UPSTREAM_COMPOSITION_MODULE,
  routeSyncStandaloneCompositionModuleSourceFactory,
} from '../standaloneCompositionLoader';
import { requestTypeDerivationSemanticComposition } from '@routesync/core/upstream';

describe('Phase 2661 standalone composition boundary', () => {
  it.each([undefined, '', '   '])('does not substitute a diagnostic composition when module path is %s', async modulePath => {
    await expect(routeSyncStandaloneCompositionLoader.load(routeSyncStandaloneCompositionModuleSourceFactory.fromEnvironment({ [ROUTESYNC_UPSTREAM_COMPOSITION_MODULE]: modulePath }))).resolves.toEqual({
      kind: 'composition_module_missing',
      environmentVariable: ROUTESYNC_UPSTREAM_COMPOSITION_MODULE,
    });
  });

  it('loads the interface-typed composition through the published package export', async () => {
    // This integration test runs against the built package export declared in
    // the root package.json, not the workspace-only TypeScript source alias.
    const result = await routeSyncStandaloneCompositionLoader.load(routeSyncStandaloneCompositionModuleSourceFactory.fromSpecifier('routesync/upstream'));
    expect(result.kind).toBe('composition_module_loaded');
    if (result.kind === 'composition_module_loaded') {
      expect(result.composition.contract).not.toBe(requestTypeDerivationSemanticComposition.contract);
      expect(result.composition.contract).toEqual(requestTypeDerivationSemanticComposition.contract);
    }
  });

  it('returns a typed import failure for a configured but unresolvable module', async () => {
    const result = await routeSyncStandaloneCompositionLoader.load(routeSyncStandaloneCompositionModuleSourceFactory.fromSpecifier('./.routesync-nonexistent-upstream-composition.mjs'));
    expect(result.kind).toBe('composition_module_import_failed');
    if (result.kind === 'composition_module_import_failed') {
      expect(result.modulePath).toBe('./.routesync-nonexistent-upstream-composition.mjs');
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it('returns invalid_composition when host-controlled property access throws during validation', async () => {
    const source = `const value = {}; Object.defineProperty(value, 'contract', { get() { throw new Error('host getter'); } }); export const requestTypeDerivationSemanticComposition = value;`;
    const moduleSpecifier = `data:text/javascript,${encodeURIComponent(source)}`;
    await expect(routeSyncStandaloneCompositionLoader.load(routeSyncStandaloneCompositionModuleSourceFactory.fromSpecifier(moduleSpecifier))).resolves.toEqual({
      kind: 'composition_module_invalid',
      modulePath: moduleSpecifier,
      reason: 'invalid_composition',
    });
  });

  it('rejects a cyclic foreign contract without unbounded structural comparison', async () => {
    const source = `const contract = {}; contract.self = contract; export const requestTypeDerivationSemanticComposition = { contract };`;
    const moduleSpecifier = `data:text/javascript,${encodeURIComponent(source)}`;
    await expect(routeSyncStandaloneCompositionLoader.load(routeSyncStandaloneCompositionModuleSourceFactory.fromSpecifier(moduleSpecifier))).resolves.toEqual({
      kind: 'composition_module_invalid',
      modulePath: moduleSpecifier,
      reason: 'invalid_composition',
    });
  });
});


describe('Phase 2678 runtime capability-shape gate', () => {
  it('accepts the in-repository diagnostic composition shape without implying production completeness', () => {
    expect(routeSyncStandaloneCompositionGuard.isComposition(requestTypeDerivationSemanticComposition)).toBe(true);
  });

  it('accepts an equivalent canonical contract from a separately bundled package graph', () => {
    const contract = structuredClone(requestTypeDerivationSemanticComposition.contract);
    const composition = requestTypeDerivationSemanticComposition;
    const crossGraphComposition = {
      ...composition,
      contract,
      reasoning: { ...composition.reasoning, contract },
      verifier: { ...composition.verifier, contract },
      decision: { ...composition.decision, contract },
      authority: { ...composition.authority, contract },
      integrity: { ...composition.integrity, contract },
    };
    expect(contract).not.toBe(composition.contract);
    expect(contract).toEqual(composition.contract);
    expect(routeSyncStandaloneCompositionGuard.isComposition(crossGraphComposition)).toBe(true);
  });

  it('rejects a separately bundled contract whose semantic policy differs', () => {
    const composition = requestTypeDerivationSemanticComposition;
    const contract = structuredClone(composition.contract) as typeof composition.contract;
    const alteredContract = {
      ...contract,
      policy: { ...contract.policy, requestResolution: { ...contract.policy.requestResolution, missing: 'derived' } },
    };
    const crossGraphComposition = {
      ...composition,
      contract: alteredContract,
      reasoning: { ...composition.reasoning, contract: alteredContract },
      verifier: { ...composition.verifier, contract: alteredContract },
      decision: { ...composition.decision, contract: alteredContract },
      authority: { ...composition.authority, contract: alteredContract },
      integrity: { ...composition.integrity, contract: alteredContract },
    };
    expect(routeSyncStandaloneCompositionGuard.isComposition(crossGraphComposition)).toBe(false);
  });

  it('rejects a host composition without executable source preparation', () => {
    const composition = requestTypeDerivationSemanticComposition;
    expect(routeSyncStandaloneCompositionGuard.isComposition({ ...composition, preparation: {} })).toBe(false);
    expect(routeSyncStandaloneCompositionGuard.isComposition({ ...composition, preparation: undefined })).toBe(false);
  });

  it('rejects a host composition whose decision rule inventory is incomplete', () => {
    const composition = requestTypeDerivationSemanticComposition;
    const authority = {
      ...composition.authority,
      decisionRules: Object.fromEntries(
        Object.entries(composition.authority.decisionRules).filter(([ruleId]) => ruleId !== 'closed_derivation_with_complete_verification'),
      ),
    };
    expect(routeSyncStandaloneCompositionGuard.isComposition({ ...composition, authority })).toBe(false);
  });

  it('rejects an integrity capability without executable contract equivalence', () => {
    const composition = requestTypeDerivationSemanticComposition;
    const integrity = { ...composition.integrity, contractEquivalence: {} };
    expect(routeSyncStandaloneCompositionGuard.isComposition({ ...composition, integrity })).toBe(false);
  });
});
