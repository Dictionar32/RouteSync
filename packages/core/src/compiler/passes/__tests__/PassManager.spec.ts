import { describe, test, expect, expectTypeOf } from 'vitest';
import { PassManager } from '../PassManager';
import { CompilationContext } from '../CompilationContext';

describe('PassManager Constructor TDD Specification', () => {
    test('1. Default constructor initializes context and empty passes cleanly', () => {
        expectTypeOf<typeof PassManager>().toBeConstructibleWith();
        const manager = new PassManager();
        expect(manager.context).toBeInstanceOf(CompilationContext);
        expect(manager.passes).toHaveLength(0);
    });

    test('2. Constructor with custom instances injects dependencies immutably', () => {
        const customContext = new CompilationContext({ strict: false });
        const manager = new PassManager({
            context: customContext
        });
        expect(manager.context).toBe(customContext);
        expect(manager.context.strict).toBe(false);
    });
});