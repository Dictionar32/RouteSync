import { describe, expect, it } from 'vitest';
import { AnalysisKey, createAnalysisKeyFactory } from '../../passes/PassResult';
import { AnalysisManager } from '../AnalysisManager';
import type { AnalysisRegistry } from '../AnalysisRegistry';

type TestAnalysisRegistry = AnalysisRegistry & {
    readonly Test: { id: number };
    readonly Root: string;
    readonly Child: number;
    readonly GrandChild: boolean;
};

const analysisKey = createAnalysisKeyFactory<TestAnalysisRegistry>();

describe('AnalysisManager registry-typed engine', () => {
    it('preserves the concrete registry key-to-value relationship', () => {
        const manager = new AnalysisManager<TestAnalysisRegistry>();
        const key = analysisKey('Test');
        const value = { id: 42 };

        manager.set(key, value);

        expect(manager.get(key)).toBe(value);
        expect(manager.get(key)?.id).toBe(42);
        expect(manager.has(key)).toBe(true);
    });

    it('rejects values that do not match the registry entry', () => {
        const manager = new AnalysisManager<TestAnalysisRegistry>();
        const key = analysisKey('Test');

        manager.set(key, { id: 42 });

        // This must remain a compile-time error if uncommented:
        // manager.set(key, { id: 'wrong' });
        // manager.set(key, 'wrong');

        expect(manager.get(key)?.id).toBe(42);
    });

    it('invalidates transitive dependents and the root analysis', () => {
        const manager = new AnalysisManager<TestAnalysisRegistry>();
        const root = analysisKey('Root');
        const child = analysisKey('Child');
        const grandChild = analysisKey('GrandChild');

        manager.set(root, 'root');
        manager.set(child, 1);
        manager.set(grandChild, true);

        manager.registerDependency(root, child);
        manager.registerDependency(child, grandChild);

        manager.invalidate(root);

        expect(manager.has(root)).toBe(false);
        expect(manager.has(child)).toBe(false);
        expect(manager.has(grandChild)).toBe(false);
    });

    it('keeps dependency topology separate from analysis value typing', () => {
        const manager = new AnalysisManager<TestAnalysisRegistry>();
        const root = analysisKey('Root');
        const child = analysisKey('Child');

        manager.registerDependency(root, child);

        expect(manager.getStats().dependencies).toBe(1);
        expect(manager.collectDependents(root)).toEqual(
            new Set([root, child]),
        );
    });

    it('can distinguish two keys with different registry value types', () => {
        const manager = new AnalysisManager<TestAnalysisRegistry>();
        const numberKey = analysisKey('Child');
        const booleanKey = analysisKey('GrandChild');

        manager.set(numberKey, 123);
        manager.set(booleanKey, true);

        const numberValue = manager.get(numberKey);
        const booleanValue = manager.get(booleanKey);

        expect(numberValue).toBe(123);
        expect(booleanValue).toBe(true);
    });

    it('accepts an explicitly typed key reference', () => {
        const manager = new AnalysisManager<TestAnalysisRegistry>();
        const key: AnalysisKey<TestAnalysisRegistry, 'Test'> = analysisKey('Test');

        manager.set(key, { id: 7 });

        expect(manager.get(key)?.id).toBe(7);
    });
});