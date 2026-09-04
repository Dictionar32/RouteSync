/**
 * CompilationContext.ts
 *
 * Encapsulates the environment and services for compiler pass execution.
 * Structured constructor with default factory dependencies.
 *
 * @module compiler/passes
 */

import { DiagnosticBag } from '../diagnostics/DiagnosticBag';

export interface CompilerOptions {
    readonly watch?: boolean;
    readonly strict?: boolean;
    readonly targetBackend?: string;
    readonly revision?: string;
}

export interface VirtualFileWriter {
    writeFile(path: string, content: string): void;
}

export class InMemoryFileWriter implements VirtualFileWriter {
    public readonly files = new Map<string, string>();

    writeFile(path: string, content: string): void {
        this.files.set(path, content);
    }
}

export interface CompilationContextDependencies {
    readonly diagnostics?: DiagnosticBag;
    readonly fileWriter?: VirtualFileWriter;
    readonly watch?: boolean;
    readonly strict?: boolean;
    readonly targetBackend?: string;
    readonly revision?: string;
}

export class CompilationContext {
    public readonly diagnostics: DiagnosticBag;
    public readonly fileWriter: VirtualFileWriter;
    public readonly watch: boolean;
    public readonly strict: boolean;
    public readonly targetBackend: string;
    public readonly revision: string;

    constructor({
        diagnostics = DiagnosticBag.createEmpty(),
        fileWriter = new InMemoryFileWriter(),
        watch = false,
        strict = true,
        targetBackend = 'typescript',
        revision = '1.0.0'
    }: CompilationContextDependencies = {}) {
        this.diagnostics = diagnostics;
        this.fileWriter = fileWriter;
        this.watch = watch;
        this.strict = strict;
        this.targetBackend = targetBackend;
        this.revision = revision;
        Object.freeze(this);
    }
}