import { describe, test, expect, expectTypeOf } from 'vitest';
import { CompilationContext, InMemoryFileWriter } from '../CompilationContext';
import { DiagnosticBag } from '../../diagnostics/DiagnosticBag';

describe('CompilationContext Constructor TDD Specification', () => {
    test('1. Default constructor initializes default services cleanly', () => {
        expectTypeOf<typeof CompilationContext>().toBeConstructibleWith();
        const ctx = new CompilationContext();
        expect(ctx.diagnostics).toBeInstanceOf(DiagnosticBag);
        expect(ctx.fileWriter).toBeInstanceOf(InMemoryFileWriter);
        expect(ctx.watch).toBe(false);
        expect(ctx.strict).toBe(true);
        expect(ctx.targetBackend).toBe('typescript');
        expect(ctx.revision).toBe('1.0.0');
    });

    test('2. Constructor with custom parameters initializes immutably', () => {
        const customDiagnostics = DiagnosticBag.createEmpty(); // ◄── Menggunakan createEmpty()
        const customWriter = new InMemoryFileWriter();
        const ctx = new CompilationContext({
            diagnostics: customDiagnostics,
            fileWriter: customWriter,
            watch: true,
            strict: false,
            targetBackend: 'zod'
        });
        expect(ctx.diagnostics).toBe(customDiagnostics);
        expect(ctx.fileWriter).toBe(customWriter);
        expect(ctx.watch).toBe(true);
        expect(ctx.strict).toBe(false);
        expect(ctx.targetBackend).toBe('zod');
    });
});