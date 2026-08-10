/**
 * @file ImportCollector.test.ts
 * @description Unit tests for ImportCollector
 * 
 * Phase 3 - Day 1, Task 1.2
 * Tests import collection, deduplication, and sorting
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ImportCollector } from '../ImportCollector';

describe('ImportCollector', () => {
    let collector: ImportCollector;

    beforeEach(() => {
        collector = new ImportCollector();
    });

    describe('addNamedImport', () => {
        it('should collect single named import', () => {
            collector.addNamedImport('User', './types');

            const imports = collector.getImports();
            expect(imports).toHaveLength(1);
            expect(imports[0].source).toBe('./types');
            expect(imports[0].named.has('User')).toBe(true);
            expect(imports[0].isTypeOnly).toBe(true);
        });

        it('should collect multiple named imports from same source', () => {
            collector.addNamedImport('User', './types');
            collector.addNamedImport('Post', './types');
            collector.addNamedImport('Product', './types');

            const imports = collector.getImports();
            expect(imports).toHaveLength(1);
            expect(imports[0].named.size).toBe(3);
            expect(imports[0].named.has('User')).toBe(true);
            expect(imports[0].named.has('Post')).toBe(true);
            expect(imports[0].named.has('Product')).toBe(true);
        });

        it('should deduplicate same import from same source', () => {
            collector.addNamedImport('User', './types');
            collector.addNamedImport('User', './types');
            collector.addNamedImport('User', './types');

            const imports = collector.getImports();
            expect(imports).toHaveLength(1);
            expect(imports[0].named.size).toBe(1);
        });

        it('should handle imports from different sources', () => {
            collector.addNamedImport('User', './types');
            collector.addNamedImport('Product', './models');

            const imports = collector.getImports();
            expect(imports).toHaveLength(2);
        });

        it('should handle value imports (isTypeOnly: false)', () => {
            collector.addNamedImport('useState', 'react', false);

            const imports = collector.getImports();
            expect(imports[0].isTypeOnly).toBe(false);
        });
    });

    describe('addDefaultImport', () => {
        it('should collect default import', () => {
            collector.addDefaultImport('React', 'react');

            const imports = collector.getImports();
            expect(imports).toHaveLength(1);
            expect(imports[0].defaultImport).toBe('React');
            expect(imports[0].source).toBe('react');
        });

        it('should combine default import with named imports', () => {
            collector.addDefaultImport('React', 'react');
            collector.addNamedImport('useState', 'react', false);
            collector.addNamedImport('useEffect', 'react', false);

            const imports = collector.getImports();
            expect(imports).toHaveLength(1);
            expect(imports[0].defaultImport).toBe('React');
            expect(imports[0].named.size).toBe(2);
        });
    });

    describe('addNamespaceImport', () => {
        it('should collect namespace import', () => {
            collector.addNamespaceImport('types', './types');

            const imports = collector.getImports();
            expect(imports).toHaveLength(1);
            expect(imports[0].namespaceImport).toBe('types');
        });

        it('should combine namespace with named imports', () => {
            collector.addNamespaceImport('types', './types');
            collector.addNamedImport('User', './types');

            const imports = collector.getImports();
            expect(imports).toHaveLength(1);
            expect(imports[0].namespaceImport).toBe('types');
            expect(imports[0].named.has('User')).toBe(true);
        });
    });

    describe('getImports', () => {
        it('should return empty array when no imports collected', () => {
            const imports = collector.getImports();
            expect(imports).toEqual([]);
        });

        it('should sort imports by source path alphabetically', () => {
            collector.addNamedImport('User', './z-last');
            collector.addNamedImport('Product', './a-first');
            collector.addNamedImport('Post', './m-middle');

            const imports = collector.getImports();
            expect(imports).toHaveLength(3);
            expect(imports[0].source).toBe('./a-first');
            expect(imports[1].source).toBe('./m-middle');
            expect(imports[2].source).toBe('./z-last');
        });

        it('should sort named imports alphabetically within each source', () => {
            collector.addNamedImport('Zebra', './types');
            collector.addNamedImport('Apple', './types');
            collector.addNamedImport('Mango', './types');

            const imports = collector.getImports();
            const names = Array.from(imports[0].named);
            expect(names).toEqual(['Apple', 'Mango', 'Zebra']);
        });

        it('should return immutable specs', () => {
            collector.addNamedImport('User', './types');
            const imports = collector.getImports();

            // Spec object di-freeze (Object.freeze) — mutasi properti harus gagal
            expect(Object.isFrozen(imports[0])).toBe(true);

            // `named` adalah Set biasa (type-level ReadonlySet) — .add() tidak
            // throw, tapi karena getImports() selalu mengembalikan SALINAN baru,
            // mutasi oleh caller tidak boleh mempengaruhi pemanggilan berikutnya.
            // @ts-expect-error Testing immutability
            imports[0].named.add('Hacker');
            expect(Array.from(imports[0].named)).toContain('Hacker');

            const fresh = collector.getImports();
            expect(Array.from(fresh[0].named)).toEqual(['User']);
            expect(fresh[0].named.has('Hacker')).toBe(false);
        });
    });

    describe('has', () => {
        it('should return true if import collected', () => {
            collector.addNamedImport('User', './types');
            expect(collector.has('User', './types')).toBe(true);
        });

        it('should return false if import not collected', () => {
            expect(collector.has('User', './types')).toBe(false);
        });

        it('should return false if name exists but source different', () => {
            collector.addNamedImport('User', './types');
            expect(collector.has('User', './models')).toBe(false);
        });
    });

    describe('clear', () => {
        it('should clear all collected imports', () => {
            collector.addNamedImport('User', './types');
            collector.addNamedImport('Post', './models');

            collector.clear();

            const imports = collector.getImports();
            expect(imports).toHaveLength(0);
        });
    });

    describe('sourceCount', () => {
        it('should return 0 when no imports', () => {
            expect(collector.sourceCount).toBe(0);
        });

        it('should count unique sources', () => {
            collector.addNamedImport('User', './types');
            collector.addNamedImport('Post', './types');
            collector.addNamedImport('Product', './models');

            expect(collector.sourceCount).toBe(2);
        });
    });

    describe('namedCount', () => {
        it('should return 0 when no imports', () => {
            expect(collector.namedCount).toBe(0);
        });

        it('should count total named imports', () => {
            collector.addNamedImport('User', './types');
            collector.addNamedImport('Post', './types');
            collector.addNamedImport('Product', './models');
            collector.addNamedImport('Order', './models');

            expect(collector.namedCount).toBe(4);
        });

        it('should not count default or namespace imports', () => {
            collector.addNamedImport('User', './types');
            collector.addDefaultImport('React', 'react');
            collector.addNamespaceImport('types', './all-types');

            expect(collector.namedCount).toBe(1);
        });
    });

    describe('complex scenarios', () => {
        it('should handle mixed import types from multiple sources', () => {
            // Type imports
            collector.addNamedImport('User', './types', true);
            collector.addNamedImport('Post', './types', true);

            // Value imports
            collector.addNamedImport('useState', 'react', false);
            collector.addNamedImport('useEffect', 'react', false);
            collector.addDefaultImport('React', 'react', false);

            // Namespace import
            collector.addNamespaceImport('models', './models', true);

            const imports = collector.getImports();
            expect(imports).toHaveLength(3);

            // Check ./models
            const modelsImport = imports.find(i => i.source === './models');
            expect(modelsImport?.namespaceImport).toBe('models');
            expect(modelsImport?.isTypeOnly).toBe(true);

            // Check ./types
            const typesImport = imports.find(i => i.source === './types');
            expect(typesImport?.named.size).toBe(2);
            expect(typesImport?.isTypeOnly).toBe(true);

            // Check react
            const reactImport = imports.find(i => i.source === 'react');
            expect(reactImport?.defaultImport).toBe('React');
            expect(reactImport?.named.size).toBe(2);
            expect(reactImport?.isTypeOnly).toBe(false);
        });
    });
});
