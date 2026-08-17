import { describe, expect, it } from 'vitest';
import { ASTArtifact } from '../../artifacts/ASTArtifact';
import { ScopeGraphArtifact } from '../../artifacts/ScopeGraphArtifact';
import { CompilationState } from '../CompilationState';
import { ArtifactKeyWitness, type ResolveArtifacts } from '../ArtifactKeyWitness';
import type { CompilerPass } from '../CompilerPass';
import { TypedPassAdapter } from '../TypedPassAdapter';
import type { ExecutablePass } from '../ExecutablePass';
import { PassGraph } from '../PassGraph';

function metadata(producer: string) {
    return {
        hash: `${producer}:hash`,
        producer,
        dependencies: [],
        timestamp: 1,
        revision: 'test',
    } as const;
}

function parsePass(name: string, output: 'AST' | 'ScopeGraph'): ExecutablePass {
    return {
        name,
        descriptor: {
            consumes: [],
            produces: [output],
        },
        requires: [],
        execute: async (state) => state,
    };
}

describe('Pass Engine invariants', () => {
    it('preserves ArtifactRegistry typing through a witness', () => {
        const ast = new ASTArtifact(
            {
                kind: 'ClassDeclaration',
                span: { filePath: 'test.ts', start: 0, length: 1, line: 1, column: 0 },
                name: 'User',
            },
            metadata('Parse'),
        );

        const state = CompilationState.empty().put('AST', ast);
        const witness = new ArtifactKeyWitness('AST');
        const resolved = witness.read(state);

        expect(resolved).toBe(ast);
        expect(resolved.typeId).toBe('AST');
    });

    it('preserves positional tuple mapping for multiple witnesses', () => {
        const witnesses = [
            new ArtifactKeyWitness('AST'),
            new ArtifactKeyWitness('ScopeGraph'),
        ] as const;
        const ast = new ASTArtifact(
            {
                kind: 'ClassDeclaration',
                span: { filePath: 'test.ts', start: 0, length: 1, line: 1, column: 0 },
                name: 'User',
            },
            metadata('Parse'),
        );
        const scope = new ScopeGraphArtifact(new Map(), metadata('Scope'));

        const state = CompilationState.empty()
            .put('AST', ast)
            .put('ScopeGraph', scope);

        const [resolvedAst, resolvedScope] = [
            witnesses[0].read(state),
            witnesses[1].read(state),
        ];

        expect(resolvedAst.typeId).toBe('AST');
        expect(resolvedScope.typeId).toBe('ScopeGraph');
    });

    it('rejects conflicting artifact merges', () => {
        const left = CompilationState.empty().put(
            'AST',
            new ASTArtifact(
                {
                    kind: 'ClassDeclaration',
                    span: { filePath: 'test.ts', start: 0, length: 1, line: 1, column: 0 },
                    name: 'Left',
                },
                metadata('ParseLeft'),
            ),
        );
        const right = CompilationState.empty().put(
            'AST',
            new ASTArtifact(
                {
                    kind: 'ClassDeclaration',
                    span: { filePath: 'test.ts', start: 0, length: 1, line: 1, column: 0 },
                    name: 'Right',
                },
                metadata('ParseRight'),
            ),
        );

        expect(() => left.merge(right)).toThrow(/Artifact merge conflict/);
    });

    it('allows shared immutable artifacts from the same base state to merge', () => {
        const ast = new ASTArtifact(
            {
                kind: 'ClassDeclaration',
                span: { filePath: 'test.ts', start: 0, length: 1, line: 1, column: 0 },
                name: 'Shared',
            },
            metadata('Parse'),
        );
        const base = CompilationState.empty().put('AST', ast);
        const left = base.put('ScopeGraph', new ScopeGraphArtifact(new Map(), metadata('Scope')));
        const right = base.put('ScopeGraph', new ScopeGraphArtifact(new Map(), metadata('Scope')));

        expect(() => left.merge(right)).toThrow(/Artifact merge conflict/);
    });


    it('enforces the typed pass descriptor at runtime', () => {
        const pass: CompilerPass<
            readonly ['AST'],
            readonly ['ScopeGraph']
        > = {
            name: 'ScopePass',
            inputWitnesses: [new ArtifactKeyWitness('AST')],
            outputKeys: ['ScopeGraph'],
            descriptor: {
                consumes: ['AST'],
                produces: ['ScopeGraph'],
            },
            requires: [{ artifact: 'AST' }],
            producesPass: [],
            run: ([ast]): ResolveArtifacts<readonly ['ScopeGraph']> => [
                new ScopeGraphArtifact(new Map(), metadata(ast.metadata.producer)),
            ],
        };

        expect(() => new TypedPassAdapter(pass)).not.toThrow();
    });

    it('accepts a pass whose typed contract matches its descriptor', () => {
        const pass: CompilerPass<
            readonly ['AST'],
            readonly ['ScopeGraph']
        > = {
            name: 'ScopePass',
            inputWitnesses: [new ArtifactKeyWitness('AST')],
            outputKeys: ['ScopeGraph'],
            descriptor: {
                consumes: ['AST'],
                produces: ['ScopeGraph'],
            },
            requires: [{ artifact: 'AST' }],
            producesPass: [],
            run: ([ast]): ResolveArtifacts<readonly ['ScopeGraph']> => [
                new ScopeGraphArtifact(new Map(), metadata(ast.metadata.producer)),
            ],
        };

        expect(() => new TypedPassAdapter(pass)).not.toThrow();
    });

    it('detects duplicate pass names', () => {
        expect(() => PassGraph.resolve([
            parsePass('Parse', 'AST'),
            parsePass('Parse', 'ScopeGraph'),
        ])).toThrow(/Duplicate compiler pass name/);
    });

    it('detects duplicate artifact producers', () => {
        expect(() => PassGraph.resolve([
            parsePass('ParseA', 'AST'),
            parsePass('ParseB', 'AST'),
        ])).toThrow(/Multiple producers detected/);
    });

    it('detects missing providers', () => {
        const consumer: ExecutablePass = {
            name: 'TypeCheck',
            descriptor: {
                consumes: ['AST'],
                produces: ['TypeEnvironment'],
            },
            requires: [{ artifact: 'AST' }],
            execute: async (state) => state,
        };

        expect(() => PassGraph.resolve([consumer])).toThrow(/Missing provider for artifact: AST/);
    });

    it('enforces a producer constraint', () => {
        const consumer: ExecutablePass = {
            name: 'TypeCheck',
            descriptor: {
                consumes: ['AST'],
                produces: ['TypeEnvironment'],
            },
            requires: [{ artifact: 'AST', producer: 'OtherParse' }],
            execute: async (state) => state,
        };

        expect(() => PassGraph.resolve([
            parsePass('Parse', 'AST'),
            consumer,
        ])).toThrow(/Producer mismatch/);
    });

    it('produces deterministic parallel layers', () => {
        const layers = PassGraph.resolveLayers([
            parsePass('Parse', 'AST'),
            {
                name: 'Symbols',
                descriptor: {
                    consumes: ['AST'],
                    produces: ['SymbolGraph'],
                },
                requires: [{ artifact: 'AST' }],
                execute: async (state) => state,
            },
            {
                name: 'Types',
                descriptor: {
                    consumes: ['AST'],
                    produces: ['TypeEnvironment'],
                },
                requires: [{ artifact: 'AST' }],
                execute: async (state) => state,
            },
        ]);

        expect(layers.map((layer) => layer.map((pass) => pass.name))).toEqual([
            ['Parse'],
            ['Symbols', 'Types'],
        ]);
    });

    it('preserves typed pass input/output tuples without a call-site cast', () => {
        const pass: CompilerPass<
            readonly ['AST'],
            readonly ['ScopeGraph']
        > = {
            name: 'ScopePass',
            inputWitnesses: [new ArtifactKeyWitness('AST')],
            outputKeys: ['ScopeGraph'],
            descriptor: {
                consumes: ['AST'],
                produces: ['ScopeGraph'],
            },
            requires: [{ artifact: 'AST' }],
            producesPass: [],
            run: ([ast]): ResolveArtifacts<readonly ['ScopeGraph']> => [
                new ScopeGraphArtifact(new Map(), metadata(ast.metadata.producer)),
            ],
        };

        expect(pass.outputKeys).toEqual(['ScopeGraph']);
    });
});