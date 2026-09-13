/**
 * Import Storage and Accumulator.
 *
 * @module compiler/generators/typescript/import-collector
 */

import {
    type ImportSpec,
    type MutableImportSpec,
    freezeImportSpec
} from './importSpec';

export class ImportStorage {
    private readonly imports = new Map<string, MutableImportSpec>();

    public addNamed(name: string, source: string, isTypeOnly: boolean): void {
        let spec = this.imports.get(source);
        if (!spec) {
            spec = {
                source,
                named: new Set(),
                isTypeOnly
            };
            this.imports.set(source, spec);
        }
        spec.named.add(name);
    }

    public addDefault(defaultName: string, source: string, isTypeOnly: boolean): void {
        let spec = this.imports.get(source);
        if (!spec) {
            spec = {
                source,
                named: new Set(),
                defaultImport: defaultName,
                isTypeOnly
            };
            this.imports.set(source, spec);
        } else {
            spec.defaultImport = defaultName;
        }
    }

    public addNamespace(namespaceName: string, source: string, isTypeOnly: boolean): void {
        let spec = this.imports.get(source);
        if (!spec) {
            spec = {
                source,
                named: new Set(),
                namespaceImport: namespaceName,
                isTypeOnly
            };
            this.imports.set(source, spec);
        } else {
            spec.namespaceImport = namespaceName;
        }
    }

    public getSortedSpecs(): readonly ImportSpec[] {
        const specs: ImportSpec[] = [];
        for (const mutable of this.imports.values()) {
            specs.push(freezeImportSpec(mutable));
        }
        specs.sort((a, b) => a.source.localeCompare(b.source));
        return specs;
    }

    public has(name: string, source: string): boolean {
        const spec = this.imports.get(source);
        return spec ? spec.named.has(name) : false;
    }

    public clear(): void {
        this.imports.clear();
    }

    public get sourceCount(): number {
        return this.imports.size;
    }

    public get namedCount(): number {
        let count = 0;
        for (const spec of this.imports.values()) {
            count += spec.named.size;
        }
        return count;
    }
}
