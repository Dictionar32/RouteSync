import { describe, expect, it } from 'vitest';
import {
    createQueryKey,
    createQueryCycleError,
    createSalsaCompiler,
} from '../SalsaCompiler';
import { createSymbolDatabase } from '../../analysis';

describe('SalsaCompiler typed query boundary', () => {
    it('returns the concrete query output type from a cache hit', () => {
        const compiler = createSalsaCompiler(createSymbolDatabase());
        const key = createQueryKey<{ value: number }>(
            'test',
            'item',
            'default',
        );

        let executions = 0;

        const first = compiler.executeQuery(
            key,
            () => {
                executions += 1;
                return { value: 42 };
            },
            undefined,
            1,
        );

        const second = compiler.executeQuery(
            key,
            () => {
                executions += 1;
                return { value: 999 };
            },
            undefined,
            1,
        );

        expect(first.value).toBe(42);
        expect(second.value).toBe(42);
        expect(executions).toBe(1);
    });

    it('recomputes after a new revision', () => {
        const compiler = createSalsaCompiler(createSymbolDatabase());
        const key = createQueryKey<number>(
            'revisioned',
            'item',
            'default',
        );

        let executions = 0;

        const first = compiler.executeQuery(
            key,
            () => {
                executions += 1;
                return executions;
            },
            undefined,
            1,
        );

        const second = compiler.executeQuery(
            key,
            () => {
                executions += 1;
                return executions;
            },
            undefined,
            2,
        );

        expect(first).toBe(1);
        expect(second).toBe(2);
        expect(executions).toBe(2);
    });


    it('replaces outgoing dependencies and removes stale reverse edges', () => {
        const compiler = createSalsaCompiler(createSymbolDatabase());
        const keyA = createQueryKey<string>('queryA', 'A', 'default');
        const keyB = createQueryKey<string>('queryB', 'B', 'default');
        const keyC = createQueryKey<string>('queryC', 'C', 'default');
        let useB = true;
        let aExecutions = 0;
        let bExecutions = 0;
        let cExecutions = 0;

        const queryB = () => `B${++bExecutions}`;
        const queryC = () => `C${++cExecutions}`;
        const queryA = () => {
            aExecutions += 1;
            return useB
                ? `A(${compiler.executeQuery(keyB, queryB, undefined, 1)})`
                : `A(${compiler.executeQuery(keyC, queryC, undefined, 1)})`;
        };

        expect(compiler.executeQuery(keyA, queryA, undefined, 1)).toBe('A(B1)');
        useB = false;
        expect(compiler.executeQuery(keyA, queryA, undefined, 2)).toBe('A(C1)');
        expect(aExecutions).toBe(2);

        // Re-executing B at the same revision must not invalidate A after A stopped depending on B.
        compiler.executeQuery(keyB, queryB, undefined, 2);
        expect(compiler.executeQuery(keyA, queryA, undefined, 2)).toBe('A(C1)');
        expect(aExecutions).toBe(2);
        expect(bExecutions).toBe(2);
        expect(cExecutions).toBe(1);
    });

    it('restores the active query stack after a failed computation', () => {
        const compiler = createSalsaCompiler(createSymbolDatabase());
        const key = createQueryKey<number>('failed', 'node', 'default');

        expect(() => compiler.executeQuery(key, () => { throw new Error('boom'); }, undefined, 1)).toThrow('boom');
        expect(compiler.executeQuery(key, () => 7, undefined, 1)).toBe(7);
        expect(compiler.getStats().activeQueries).toBe(0);
    });

    it('detects recursive query execution', () => {
        const compiler = createSalsaCompiler(createSymbolDatabase());
        const key = createQueryKey<number>('cycle', 'node', 'default');

        expect(() =>
            compiler.executeQuery(
                key,
                () => compiler.executeQuery(
                    key,
                    () => 2,
                    undefined,
                    1,
                ),
                undefined,
                1,
            ),
        ).toThrow(/Query cycle detected/);
    });
});
