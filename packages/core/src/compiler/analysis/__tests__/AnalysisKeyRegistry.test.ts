import { describe, expect, it } from 'vitest';
import { AnalysisManager } from '../AnalysisManager';
import {
    CFGAnalysis,
    DominatorsAnalysis,
} from '../AnalysisKey';
import { createAnalysisKeyFactory } from '../../passes/PassResult';
import type { AnalysisRegistry } from '../AnalysisRegistry';

interface TestRegistry extends AnalysisRegistry {
    readonly Test: { id: number };
}

describe('AnalysisKey registry', () => {
    it('maps a standard key to its registry value type', () => {
        const manager = new AnalysisManager();
        const cfg = manager.get(CFGAnalysis);

        expect(cfg).toBeUndefined();
        expect(DominatorsAnalysis.name).toBe('Dominators');
    });

    it('creates custom keys without runtime validators', () => {
        const createKey = createAnalysisKeyFactory<TestRegistry>();
        const key = createKey('Test');
        const manager = new AnalysisManager<TestRegistry>();

        manager.set(key, { id: 42 });

        expect(manager.get(key)?.id).toBe(42);
    });
});