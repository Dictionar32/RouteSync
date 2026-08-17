import { describe, expect, it } from 'vitest';
import { ASTArtifact } from '../../artifacts/ASTArtifact';
import { ScopeGraphArtifact } from '../../artifacts/ScopeGraphArtifact';
import { CompilationState } from '../CompilationState';
import {
    ArtifactKeyWitness,
    type ResolveArtifacts,
} from '../ArtifactKeyWitness';
import type { CompilerPass } from '../CompilerPass';
import type { ExecutablePass } from '../ExecutablePass';
import { CompilationContext } from '../CompilationContext';
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

function createAST(name: string, producer = 'Parse'): ASTArtifact {
    return new ASTArtifact(
        {
            kind: 'ClassDeclaration',
            span: {
                filePath: 'test.ts',
                start: 0,
                length: 1,
                line: 1,
                column: 0,
            },
            name,
        },
        metadata(producer),
    );
}

function createScopeGraph(producer = 'Scope'): ScopeGraphArtifact {
    return new ScopeGraphArtifact(
        new Map(),
        metadata(producer),
    );
}

function parsePass(
    name: string,
    output: 'AST' | 'ScopeGraph',
): ExecutablePass {
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
        const ast = createAST('User');
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

        const ast = createAST('User');
        const scope = createScopeGraph();

        const state = CompilationState.empty()
            .put('AST', ast)
            .put('ScopeGraph', scope);

        const [resolvedAst, resolvedScope] = [
            witnesses[0].read(state),
            witnesses[1].read(state),
        ];

        expect(resolvedAst).toBe(ast);
        expect(resolvedScope).toBe(scope);
        expect(resolvedAst.typeId).toBe('AST');
        expect(resolvedScope.typeId).toBe('ScopeGraph');
    });

    it('rejects conflicting artifact merges', () => {
        const left = CompilationState.empty().put(
            'AST',
            createAST('Left', 'ParseLeft'),
        );

        const right = CompilationState.empty().put(
            'AST',
            createAST('Right', 'ParseRight'),
        );

        expect(() => left.merge(right)).toThrow(
            /Artifact merge conflict/,
        );
    });

    it('allows shared immutable artifacts from the same base state to merge', () => {
        const ast = createAST('Shared');
        const base = CompilationState.empty().put('AST', ast);

        const left = base.put(
            'ScopeGraph',
            createScopeGraph(),
        );

        // right shares the exact same AST object from the common base.
        // It does not produce a second ScopeGraph value for the same key.
        const right = base;

        const merged = left.merge(right);

        expect(merged.require(new ArtifactKeyWitness('AST'))).toBe(ast);
        expect(merged.require(new ArtifactKeyWitness('ScopeGraph'))).toBe(
            left.require(new ArtifactKeyWitness('ScopeGraph')),
        );
    });

    it('detects duplicate pass names', () => {
        expect(() =>
            PassGraph.resolve([
                parsePass('Parse', 'AST'),
                parsePass('Parse', 'ScopeGraph'),
            ]),
        ).toThrow(/Duplicate compiler pass name/);
    });

    it('detects duplicate artifact producers', () => {
        expect(() =>
            PassGraph.resolve([
                parsePass('ParseA', 'AST'),
                parsePass('ParseB', 'AST'),
            ]),
        ).toThrow(/Multiple producers detected/);
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

        expect(() =>
            PassGraph.resolve([consumer]),
        ).toThrow(/Missing provider for artifact: AST/);
    });

    it('enforces a producer constraint', () => {
        const consumer: ExecutablePass = {
            name: 'TypeCheck',
            descriptor: {
                consumes: ['AST'],
                produces: ['TypeEnvironment'],
            },
            requires: [
                {
                    artifact: 'AST',
                    producer: 'OtherParse',
                },
            ],
            execute: async (state) => state,
        };

        expect(() =>
            PassGraph.resolve([
                parsePass('Parse', 'AST'),
                consumer,
            ]),
        ).toThrow(/Producer mismatch/);
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

        expect(
            layers.map((layer) => layer.map((pass) => pass.name)),
        ).toEqual([
            ['Parse'],
            ['Symbols', 'Types'],
        ]);
    });

    it('preserves typed pass input/output tuples', async () => {
        const pass: CompilerPass<
            readonly ['AST'],
            readonly ['ScopeGraph']
        > = {
            name: 'ScopePass',
            inputWitnesses: [
                new ArtifactKeyWitness('AST'),
            ],
            outputKeys: ['ScopeGraph'],
            descriptor: {
                consumes: ['AST'],
                produces: ['ScopeGraph'],
            },
            requires: [{ artifact: 'AST' }],
            producesPass: [],
            run: ([ast]): ResolveArtifacts<
                readonly ['ScopeGraph']
            > => [
                    createScopeGraph(ast.metadata.producer),
                ],
        };

        const ast = createAST('User');
        const [result] = await pass.run(
            [ast],
            CompilationContext.default(),
        );

        expect(result).toBeInstanceOf(ScopeGraphArtifact);
        expect(result.typeId).toBe('ScopeGraph');
        expect(result.metadata.producer).toBe('Parse');
    });
});