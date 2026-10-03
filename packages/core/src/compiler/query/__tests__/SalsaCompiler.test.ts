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
