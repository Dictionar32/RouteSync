/**
 * @file ImportCollector.ts
 * @description Collects and manages import requirements during code generation.
 * Conforms to Rule 14: Active Consumer Orchestrator, 0 wildcard re-exports.
 *
 * @module compiler/generators/typescript
 */

import {
    type ImportSpec,
    ImportStorage
} from './import-collector';

export type { ImportSpec };

/**
 * ImportCollector - Collects and manages import requirements during code generation.
 */
export class ImportCollector {
    private readonly storage = new ImportStorage();

    public addNamedImport(name: string, source: string, isTypeOnly: boolean = true): void {
        this.storage.addNamed(name, source, isTypeOnly);
    }

    public addDefaultImport(defaultName: string, source: string, isTypeOnly: boolean = false): void {
        this.storage.addDefault(defaultName, source, isTypeOnly);
    }

    public addNamespaceImport(namespaceName: string, source: string, isTypeOnly: boolean = false): void {
        this.storage.addNamespace(namespaceName, source, isTypeOnly);
    }

    public getImports(): readonly ImportSpec[] {
        return this.storage.getSortedSpecs();
    }

    public has(name: string, source: string): boolean {
        return this.storage.has(name, source);
    }

    public clear(): void {
        this.storage.clear();
    }

    public get sourceCount(): number {
        return this.storage.sourceCount;
    }

    public get namedCount(): number {
        return this.storage.namedCount;
    }
}
