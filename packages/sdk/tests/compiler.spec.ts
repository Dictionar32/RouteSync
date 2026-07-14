import { describe, it, expect } from 'vitest';
import { v6, SemanticResolutionKernel } from '@routesync/core';
import { PhpCodeParser } from '../../cli/src/parsers/PhpCodeParser';

describe('RouteSync Compiler Core v6.1', () => {
  it('should support nominal type systems and cycle-safe relative hashing', () => {
    const interner = new v6.TypeInterner();

    const stringType = interner.intern(new v6.PrimitiveType(v6.PrimitiveKind.STRING));
    const numberType = interner.intern(new v6.PrimitiveType(v6.PrimitiveKind.NUMBER));

    expect(stringType.kind).toBe('primitive');
    expect((stringType as v6.PrimitiveType).type).toBe('string');

    // Hashing verification
    const ctx1: v6.HashContext = { activeStack: [], finalized: new WeakMap() };
    const ctx2: v6.HashContext = { activeStack: [], finalized: new WeakMap() };
    const hash1 = v6.TypeHasher.hash(stringType, ctx1);
    const hash2 = v6.TypeHasher.hash(stringType, ctx2);
    expect(hash1).toBe(hash2);
    expect(hash1).toBe('primitive:string');

    // Recursive isomorphic type graph cycle test (A -> B -> A and C -> D -> C)
    const typeA = new v6.ObjectType(new v6.ImmutableMap(new Map()), new v6.ImmutableSet(new Set()));
    const typeB = new v6.ObjectType(new v6.ImmutableMap(new Map()), new v6.ImmutableSet(new Set()));
    
    // Wire A -> B -> A
    const propsA = new Map<string, v6.SemanticType>();
    propsA.set('next', typeB);
    (typeA as any).properties = new v6.ImmutableMap(propsA);

    const propsB = new Map<string, v6.SemanticType>();
    propsB.set('next', typeA);
    (typeB as any).properties = new v6.ImmutableMap(propsB);

    // Wire C -> D -> C
    const typeC = new v6.ObjectType(new v6.ImmutableMap(new Map()), new v6.ImmutableSet(new Set()));
    const typeD = new v6.ObjectType(new v6.ImmutableMap(new Map()), new v6.ImmutableSet(new Set()));

    const propsC = new Map<string, v6.SemanticType>();
    propsC.set('next', typeD);
    (typeC as any).properties = new v6.ImmutableMap(propsC);

    const propsD = new Map<string, v6.SemanticType>();
    propsD.set('next', typeC);
    (typeD as any).properties = new v6.ImmutableMap(propsD);

    const contextA: v6.HashContext = { activeStack: [], finalized: new WeakMap() };
    const contextC: v6.HashContext = { activeStack: [], finalized: new WeakMap() };

    const hashA = v6.TypeHasher.hash(typeA, contextA);
    const hashC = v6.TypeHasher.hash(typeC, contextC);

    // Isomorphic type structures must result in completely identical structural hashes
    expect(hashA).toBe(hashC);
  });

  it('should schedule passes and validate missing dependency providers', () => {
    // Define a dummy pass that consumes 'AST' and produces 'BoundAST'
    const mockBindPass: v6.CompilerPass<['AST'], ['BoundAST']> = {
      name: 'NameBinder',
      inputWitnesses: [new v6.ArtifactKeyWitness('AST')] as any,
      outputKeys: ['BoundAST'],
      descriptor: { consumes: ['AST'], produces: ['BoundAST'] },
      requires: [],
      producesPass: [],
      run: () => [] as any
    };

    const passes = [
      new v6.TypedPassAdapter(mockBindPass)
    ];

    // Under PassGraph v6.1, resolving without declaring 'AST' as externalInput should throw an error
    expect(() => v6.PassGraph.resolve(passes, [])).toThrow(/Missing provider for artifact: AST/);

    // Providing 'AST' as external inputs should resolve correctly
    const resolved = v6.PassGraph.resolve(passes, ['AST']);
    expect(resolved.length).toBe(1);
    expect(resolved[0].name).toBe('NameBinder');
  });

  it('should solve constraints and flag diagnostics on lattice type collisions', () => {
    const solver = new v6.ConstraintSolver();

    const t1: v6.TypeVariable = { id: 1, name: 'T1' };

    const stringType = new v6.PrimitiveType(v6.PrimitiveKind.STRING);
    const numberType = new v6.PrimitiveType(v6.PrimitiveKind.NUMBER);

    // Setup bounds: T1 is supertype of string (string <: T1) and subtype of number (T1 <: number)
    const tVarSource: v6.TypeVariable = { id: 2, name: 'stringVar' };
    const tVarTarget: v6.TypeVariable = { id: 3, name: 'numberVar' };

    const constraints: v6.Constraint[] = [
      {
        kind: 'Subtype',
        source: { id: 99, name: 'temp' },
        target: t1
      },
      {
        kind: 'Subtype',
        source: t1,
        target: { id: 100, name: 'temp2' }
      }
    ];

    // Put types directly in the state solver constraints
    const mockConstraints: v6.Constraint[] = [
      { kind: 'Equality', source: { id: 1, name: 'T' }, target: { id: 1, name: 'T' } }
    ];

    // T1 <: number and string <: T1
    const sState: v6.VariableState = { lowerBounds: new Set([stringType]), upperBounds: new Set([numberType]) };
    
    // We can run solver constraint processing manually or feed contradictory constraints to bounds solver
    // Let's test checking of contradiction diagnostic generation directly by invoking checkAssignability checks:
    const contradictoryConstraints: v6.Constraint[] = [
      { kind: 'Subtype', source: { id: 1, name: 'T1' }, target: { id: 2, name: 'T2' } }
    ];
    
    // We can simulate contradict by solving contradictory subtyping
    const solverContradict = new v6.ConstraintSolver();
    
    // Injecting string <: T1 and T1 <: number
    // We can trigger it by registering bounds
    const T1: v6.TypeVariable = { id: 1, name: 'T1' };
    const T2: v6.TypeVariable = { id: 2, name: 'T2' };
    
    // In solverConstraint case 'Subtype', bounds propagate and check assignability.
    // T1 has lowerbound string, T2 has upperbound number, and T1 <: T2
    // We do this by HasType and subtyping constraints:
    const solverInstance = new v6.ConstraintSolver();

    const resultEnv = solverInstance.solve([
      { kind: 'HasType', source: T1, type: stringType },
      { kind: 'HasType', source: T2, type: numberType },
      { kind: 'Subtype', source: T1, target: T2 }
    ]);
    
    // We expect solverInstance to report a diagnostic because string <: number is false!
    expect(solverInstance.diagnostics.length).toBeGreaterThan(0);
    expect(solverInstance.diagnostics[0].code).toBe('RS1023');
    expect(solverInstance.diagnostics[0].message).toContain("Lower bound type 'string' is incompatible with upper bound type 'number'");
  });

  it('should compute deterministic options hash and handle different cache fingerprints', () => {
    const fingerprint1: v6.CompilerFingerprint = {
      compilerVersion: '6.1.0',
      parserVersion: '1.0.0',
      phpVersion: '8.2.0',
      frameworkVersion: '10.0.0',
      targetBackend: 'typescript',
      strictMode: true,
      featureFlags: new Map([['flagA', true]])
    };

    const fingerprint2: v6.CompilerFingerprint = {
      compilerVersion: '6.1.0',
      parserVersion: '1.0.0',
      phpVersion: '8.2.0',
      frameworkVersion: '10.0.0',
      targetBackend: 'typescript',
      strictMode: false, // Changed options
      featureFlags: new Map([['flagA', true]])
    };

    const hash1 = v6.computeFingerprintHash(fingerprint1);
    const hash2 = v6.computeFingerprintHash(fingerprint2);

    expect(hash1).not.toBe(hash2);
  });

  it('should support parallel pass scheduling and state merging', async () => {
    // Pass A produces SymbolGraph, consumes AST
    const passA: v6.CompilerPass<['AST'], ['SymbolGraph']> = {
      name: 'PassA',
      inputWitnesses: [new v6.ArtifactKeyWitness('AST')] as any,
      outputKeys: ['SymbolGraph'],
      descriptor: { consumes: ['AST'], produces: ['SymbolGraph'] },
      requires: [],
      producesPass: [],
      run: () => {
        return [
          new v6.SymbolGraphArtifact(
            { symbols: new Map() },
            { hash: 'hashA', producer: 'PassA', dependencies: [], timestamp: Date.now(), revision: '1' }
          )
        ] as any;
      }
    };

    // Pass B produces ConstraintGraph, consumes AST
    const passB: v6.CompilerPass<['AST'], ['ConstraintGraph']> = {
      name: 'PassB',
      inputWitnesses: [new v6.ArtifactKeyWitness('AST')] as any,
      outputKeys: ['ConstraintGraph'],
      descriptor: { consumes: ['AST'], produces: ['ConstraintGraph'] },
      requires: [],
      producesPass: [],
      run: () => {
        return [
          new v6.ConstraintGraphArtifact(
            [],
            { hash: 'hashB', producer: 'PassB', dependencies: [], timestamp: Date.now(), revision: '1' }
          )
        ] as any;
      }
    };

    // Pass C produces CompilationResult, consumes SymbolGraph and ConstraintGraph
    const passC: v6.CompilerPass<['SymbolGraph', 'ConstraintGraph'], ['CompilationResult']> = {
      name: 'PassC',
      inputWitnesses: [new v6.ArtifactKeyWitness('SymbolGraph'), new v6.ArtifactKeyWitness('ConstraintGraph')] as any,
      outputKeys: ['CompilationResult'],
      descriptor: { consumes: ['SymbolGraph', 'ConstraintGraph'], produces: ['CompilationResult'] },
      requires: [],
      producesPass: [],
      run: (inputs) => {
        const stats: v6.CompilationStatistics = { durationMs: 10, files: 1, cacheHits: 0, cacheMisses: 0, invalidatedNodes: 0 };
        const result = new v6.CompilationResult(
          new v6.ASTArtifact({ kind: 'ClassDeclaration', span: { filePath: '', start: 0, length: 0, line: 0, column: 0 }, name: '' }, { hash: '', producer: '', dependencies: [], timestamp: 0, revision: '' }),
          inputs[0],
          inputs[1],
          new v6.TypeEnvironmentArtifact(new v6.TypeEnvironment(), { hash: '', producer: '', dependencies: [], timestamp: 0, revision: '' }),
          new v6.SemanticIRArtifact([], { hash: '', producer: '', dependencies: [], timestamp: 0, revision: '' }),
          new v6.ContractGraph(new v6.ImmutableMap(new Map())),
          { forward: new Map(), reverse: new Map() },
          v6.DiagnosticBag.createEmpty(),
          { symbols: new Map() },
          stats
        );
        return [
          new v6.CompilationResultArtifact(result, { hash: 'hashC', producer: 'PassC', dependencies: [], timestamp: Date.now(), revision: '1' })
        ] as any;
      }
    };

    const manager = new v6.PassManager(['AST']);
    manager.registerPass(passA);
    manager.registerPass(passB);
    manager.registerPass(passC);

    const astInput = new v6.ASTArtifact(
      { kind: 'ClassDeclaration', span: { filePath: 'test.php', start: 0, length: 10, line: 1, column: 1 }, name: 'MyClass' },
      { hash: 'astHash', producer: 'Parser', dependencies: [], timestamp: Date.now(), revision: '1' }
    );

    const result = await manager.execute('AST', astInput);
    expect(result).toBeDefined();
    expect(result.statistics.durationMs).toBe(10);
  });

  it('should support Salsa-style memoization and dependency tracking in MemoizedQueryDatabase', () => {
    const db = new v6.MemoizedQueryDatabase();
    const queryA = v6.createMemoizedQueryKey<string>('queryA');

    let computeCount = 0;
    const mockQuery = (input: string) => {
      computeCount++;
      return input.toUpperCase();
    };

    const res1 = db.runQuery(queryA, mockQuery, 'hello', 'rev1');
    expect(res1).toBe('HELLO');
    expect(computeCount).toBe(1);

    // Dynamic cached lookup
    const res2 = db.runQuery(queryA, mockQuery, 'hello', 'rev1');
    expect(res2).toBe('HELLO');
    expect(computeCount).toBe(1); // Caching check

    // Invalidation check with different revision
    const res3 = db.runQuery(queryA, mockQuery, 'hello', 'rev2');
    expect(res3).toBe('HELLO');
    expect(computeCount).toBe(2); // Recalculated due to new revision
  });

  it('should support Arena allocation and stable SymbolId calculations', () => {
    // 1. Arena allocator check
    const arena = new v6.Arena<string>();
    const id1 = arena.allocate('Item1');
    const id2 = arena.allocate('Item2');
    expect(id1).toBe(0);
    expect(id2).toBe(1);
    expect(arena.get(id1)).toBe('Item1');

    // 2. AST Arena check
    const astArena = new v6.ASTArena();
    const span = { filePath: 'test.php', start: 0, length: 10, line: 1, column: 1 };
    const nodeId1 = astArena.allocateNode('Class', span, []);
    const nodeId2 = astArena.allocateNode('Method', span, [nodeId1]);
    expect(nodeId1).toBe(0);
    expect(nodeId2).toBe(1);
    expect(astArena.getNode(nodeId2).kind).toBe('Method');
    expect(astArena.getNode(nodeId2).children[0]).toBe(nodeId1);

    // 3. Stable SymbolId check
    const symId1 = v6.computeStableSymbolId('App\\Models', 'User', span);
    const symId2 = v6.computeStableSymbolId('App\\Models', 'User', span);
    const symId3 = v6.computeStableSymbolId('App\\Models', 'Post', span);

    expect(symId1).toBe(symId2);
    expect(symId1).not.toBe(symId3);
    expect(symId1.length).toBe(16);
  });

  it('should support CFG creation and dataflow chaotic fixed-point iteration', () => {
    // 1. Construct a simple CFG with 3 blocks: Block 0 -> Block 1 -> Block 2
    const block0: v6.BasicBlock = { id: 0, instructions: [], successors: [1], predecessors: [] };
    const block1: v6.BasicBlock = { id: 1, instructions: [], successors: [2], predecessors: [0] };
    const block2: v6.BasicBlock = { id: 2, instructions: [], successors: [], predecessors: [1] };

    const blocks = new Map<number, v6.BasicBlock>([
      [0, block0],
      [1, block1],
      [2, block2]
    ]);
    const cfg = new v6.ControlFlowGraph(0, 2, blocks);

    expect(cfg.entryBlock).toBe(0);
    expect(cfg.exitBlock).toBe(2);

    // 2. Run DataFlowAnalysis: constant propagation simulation
    const solver = new v6.DataFlowAnalysis<number>();
    const transfer = (block: v6.BasicBlock, inState: number) => {
      // Add 5 at each block step
      return inState + 5;
    };
    const merge = (states: readonly number[]) => {
      return Math.max(...states);
    };

    const results = solver.analyze(cfg, 10, transfer, merge);

    expect(results.get(0)?.inState).toBe(10);
    expect(results.get(0)?.outState).toBe(15);
    expect(results.get(1)?.inState).toBe(15);
    expect(results.get(1)?.outState).toBe(20);
    expect(results.get(2)?.inState).toBe(20);
    expect(results.get(2)?.outState).toBe(25);
  });

  it('should support SymbolDatabase registration and reference tracking', () => {
    const db = new v6.SymbolDatabase();
    const node: v6.SymbolNode = {
      id: 'user_sym',
      kind: 'class',
      name: 'User',
      namespace: 'App\\Models',
      implementsIds: []
    };

    db.registerSymbol(node);
    db.addReference('controller_sym', 'user_sym');

    expect(db.getSymbol('user_sym')).toEqual(node);
    expect(db.getReferences('controller_sym').has('user_sym')).toBe(true);
  });

  it('should support Tarjan SCC decomposition of cyclic structures', () => {
    // Construct a cyclic dependency graph:
    // A -> B -> A (SCC 1)
    // C (SCC 2)
    const graph: v6.DependencyGraph = {
      forward: new Map([
        ['A', new Set(['B'])],
        ['B', new Set(['A'])],
        ['C', new Set()]
      ]),
      reverse: new Map()
    };

    const sccs = v6.TarjanSCC.decompose(graph);

    expect(sccs.length).toBe(2);
    const sorted = sccs.map(s => [...s].sort());
    expect(sorted).toContainEqual(['A', 'B']);
    expect(sorted).toContainEqual(['C']);
  });

  it('should support Instruction IR construction and SSA value representation', () => {
    const opConst: v6.Operand = { kind: 'Constant', value: 42 };
    const opVar: v6.Operand = { kind: 'Variable', id: 1 };
    const opSSA: v6.Operand = { kind: 'SSAValue', id: 100 };

    expect(opConst.kind).toBe('Constant');
    expect(opVar.kind).toBe('Variable');
    expect(opSSA.kind).toBe('SSAValue');

    const assignInst: v6.Instruction = { kind: 'Assign', target: 1, value: opConst };
    const callInst: v6.Instruction = { kind: 'Call', target: 'log', args: [opVar] };

    expect(assignInst.kind).toBe('Assign');
    expect(callInst.kind).toBe('Call');

    const ssaBlock: v6.SSABasicBlock = {
      id: 0,
      instructions: [assignInst, callInst],
      successors: [],
      predecessors: []
    };
    const ssaRep = new v6.SSARepresentation(0, new Map([[0, ssaBlock]]));

    expect(ssaRep.entryBlock).toBe(0);
    expect(ssaRep.blocks.get(0)?.instructions.length).toBe(2);
  });

  it('should support Dominator Tree CHK iterative solving and natural loop analysis', () => {
    // Construct CFG with a loop:
    // Block 0 (entry) -> Block 1 (header) -> Block 2 -> Block 3 -> Block 1 (loop back-edge)
    //                                                -> Block 4 (exit)
    const b0: v6.BasicBlock = { id: 0, instructions: [], successors: [1], predecessors: [] };
    const b1: v6.BasicBlock = { id: 1, instructions: [], successors: [2], predecessors: [0, 3] };
    const b2: v6.BasicBlock = { id: 2, instructions: [], successors: [3], predecessors: [1] };
    const b3: v6.BasicBlock = { id: 3, instructions: [], successors: [1, 4], predecessors: [2] };
    const b4: v6.BasicBlock = { id: 4, instructions: [], successors: [], predecessors: [3] };

    const blocks = new Map<number, v6.BasicBlock>([
      [0, b0],
      [1, b1],
      [2, b2],
      [3, b3],
      [4, b4]
    ]);
    const cfg = new v6.ControlFlowGraph(0, 4, blocks);

    const dom = new v6.DominatorTree();
    dom.compute(cfg);

    expect(dom.getImmediateDominator(0)).toBe(0);
    expect(dom.getImmediateDominator(1)).toBe(0);
    expect(dom.getImmediateDominator(2)).toBe(1);
    expect(dom.getImmediateDominator(3)).toBe(2);
    expect(dom.getImmediateDominator(4)).toBe(3);

    const childrenOf1 = dom.getChildren(1);
    expect(childrenOf1.has(2)).toBe(true);

    const loops = v6.LoopAnalysis.analyze(cfg, dom);
    expect(loops.length).toBe(1);
    expect(loops[0].header).toBe(1);
    expect(loops[0].backEdges).toContain(3);
    expect(loops[0].loopBlocks.has(1)).toBe(true);
    expect(loops[0].loopBlocks.has(2)).toBe(true);
    expect(loops[0].loopBlocks.has(3)).toBe(true);
    expect(loops[0].loopBlocks.has(0)).toBe(false);
  });

  it('should support Dominance Frontier computation using Cytron algorithm', () => {
    const b0: v6.BasicBlock = { id: 0, instructions: [], successors: [1, 2], predecessors: [] };
    const b1: v6.BasicBlock = { id: 1, instructions: [], successors: [3], predecessors: [0] };
    const b2: v6.BasicBlock = { id: 2, instructions: [], successors: [3], predecessors: [0] };
    const b3: v6.BasicBlock = { id: 3, instructions: [], successors: [4], predecessors: [1, 2] };
    const b4: v6.BasicBlock = { id: 4, instructions: [], successors: [], predecessors: [3] };

    const blocks = new Map<number, v6.BasicBlock>([
      [0, b0],
      [1, b1],
      [2, b2],
      [3, b3],
      [4, b4]
    ]);
    const cfg = new v6.ControlFlowGraph(0, 4, blocks);

    const dom = new v6.DominatorTree();
    dom.compute(cfg);

    const df = new v6.DominanceFrontier();
    df.compute(cfg, dom);

    expect(df.getFrontier(1).has(3)).toBe(true);
    expect(df.getFrontier(2).has(3)).toBe(true);
    expect(df.getFrontier(0).has(3)).toBe(false);
  });

  it('should support Use-Def graph tracking and SSA dead code elimination', () => {
    const useDef = new v6.UseDefGraph();
    useDef.recordDef(10, 0);
    useDef.recordUse(10, 1);

    expect(useDef.getDefinition(10)).toBe(0);
    expect(useDef.getUses(10).has(1)).toBe(true);
    expect(useDef.getUses(11).size).toBe(0);

    const instructions: v6.Instruction[] = [
      { kind: 'Assign', target: 10, value: { kind: 'Constant', value: 42 } },
      { kind: 'Assign', target: 11, value: { kind: 'Constant', value: 100 } }
    ];

    const optimized = v6.SSAOptimizer.eliminateDeadCode(instructions, useDef);
    expect(optimized.length).toBe(1);
    expect(optimized[0]).toEqual(instructions[0]);
  });
  it('should support SalsaCompiler demand-driven typecheck querying', () => {
    const symbolDb = new v6.SymbolDatabase();

    const sym: v6.SymbolNode = {
      id: 'symA',
      kind: 'class',
      name: 'User',
      namespace: 'App\\Models',
      implementsIds: []
    };
    symbolDb.registerSymbol(sym);

    const compiler = new v6.SalsaCompiler(symbolDb);
    const type1 = compiler.typecheck('symA', 1);
    expect(type1.kind).toBe('primitive');

    const type2 = compiler.typecheck('symA', 1);
    expect(type2).toEqual(type1);
  });

  it('should support SalsaCompiler reverse-dependency invalidation and revision tracking', () => {
    const symbolDb = new v6.SymbolDatabase();
    const compiler = new v6.SalsaCompiler(symbolDb);

    let queryBCalls = 0;
    const queryB = () => {
      queryBCalls++;
      return 'dataB';
    };

    const keyB: v6.QueryKey = { queryName: 'queryB', targetId: 'B', optionsHash: 'default' };
    const keyA: v6.QueryKey = { queryName: 'queryA', targetId: 'A', optionsHash: 'default' };

    let currentRev = 1;
    const queryA = () => {
      const bVal = compiler.executeQuery(keyB, queryB, undefined, currentRev);
      return `A(${bVal})`;
    };

    const res1 = compiler.executeQuery(keyA, queryA, undefined, 1);
    expect(res1).toBe('A(dataB)');
    expect(queryBCalls).toBe(1);

    const res2 = compiler.executeQuery(keyA, queryA, undefined, 1);
    expect(res2).toBe('A(dataB)');
    expect(queryBCalls).toBe(1);

    currentRev = 2;
    const res3 = compiler.executeQuery(keyA, queryA, undefined, 2);
    expect(res3).toBe('A(dataB)');
    expect(queryBCalls).toBe(2);
  });

  it('should support SSA variable renaming pre-order traversal', () => {
    const inst1: v6.Instruction = { kind: 'Assign', target: 1, value: { kind: 'Constant', value: 5 } };
    const inst2: v6.Instruction = { kind: 'Assign', target: 2, value: { kind: 'Constant', value: 10 } };

    const b0: v6.BasicBlock = {
      id: 0,
      instructions: [inst1, inst2],
      successors: [],
      predecessors: []
    };

    const cfg = new v6.ControlFlowGraph(0, 0, new Map([[0, b0]]));
    const dom = new v6.DominatorTree();
    dom.compute(cfg);

    const renamer = new v6.SSARenamer();
    const renamedCfg = renamer.rename(cfg, dom);

    const instructions = renamedCfg.blocks.get(0)?.instructions || [];
    expect(instructions[0].kind).toBe('Assign');
    expect((instructions[0] as any).target).toBe(1);
  });

  it('should support side-effect-aware dead code elimination and IR hash fixpoints', () => {
    const useDef = new v6.UseDefGraph();
    useDef.recordDef(1, 0);

    const instructions: v6.Instruction[] = [
      { kind: 'Assign', target: 1, value: { kind: 'Constant', value: 5 } },
      { kind: 'Call', target: 'sideEffect', args: [] }
    ];

    const useDefOptimized = new v6.UseDefGraph();
    const optimized = v6.SSAOptimizer.eliminateDeadCode(instructions, useDefOptimized);

    expect(optimized.length).toBe(1);
    expect(optimized[0].kind).toBe('Call');

    const fixpointResult = v6.OptimizationPipeline.runFixpoint(instructions, useDefOptimized);
    expect(fixpointResult.length).toBe(1);
    expect(fixpointResult[0].kind).toBe('Call');
  });

  it('should support SSA Phi elimination deconstruction', () => {
    // Pred block 0
    const b0: v6.BasicBlock = {
      id: 0,
      instructions: [{ kind: 'Jump', target: 1 }],
      successors: [1],
      predecessors: []
    };

    // Block 1 with Phi node incoming from 0
    const incoming = new Map<number, v6.Operand>([[0, { kind: 'Constant', value: 42 }]]);
    const phiInst: v6.Instruction = { kind: 'Phi', target: 5, incoming };
    const b1: v6.BasicBlock = {
      id: 1,
      instructions: [phiInst],
      successors: [],
      predecessors: [0]
    };

    const cfg = new v6.ControlFlowGraph(0, 1, new Map([[0, b0], [1, b1]]));
    const deconstructed = v6.PhiEliminator.eliminate(cfg);

    const b0New = deconstructed.blocks.get(0)!;
    const b1New = deconstructed.blocks.get(1)!;

    // Verify copy instruction was pushed to predecessor block 0 before the Jump terminator
    expect(b0New.instructions.length).toBe(2);
    expect(b0New.instructions[0].kind).toBe('Assign');
    expect((b0New.instructions[0] as any).target).toBe(5);
    expect((b0New.instructions[0] as any).value).toEqual({ kind: 'Constant', value: 42 });

    // Verify phi node was removed from block 1
    expect(b1New.instructions.length).toBe(0);
  });

  it('should support SSA copy coalescing variable renaming', () => {
    const useDef = new v6.UseDefGraph();
    const insts: v6.Instruction[] = [
      { kind: 'Assign', target: 1, value: { kind: 'Constant', value: 5 } },
      { kind: 'Assign', target: 2, value: { kind: 'SSAValue', id: 1 } }
    ];

    const coalesced = v6.CopyCoalescer.coalesce(insts, useDef);
    expect(coalesced.length).toBe(1);
    expect(coalesced[0].kind).toBe('Assign');
    expect(coalesced[0].target).toBe(1);
  });

  it('should support SalsaCompiler query cycle detection', () => {
    const symbolDb = new v6.SymbolDatabase();
    const compiler = new v6.SalsaCompiler(symbolDb);

    const keyA: v6.QueryKey = { queryName: 'queryA', targetId: 'A', optionsHash: 'default' };
    const keyB: v6.QueryKey = { queryName: 'queryB', targetId: 'B', optionsHash: 'default' };

    const queryA = () => compiler.executeQuery(keyB, queryB, undefined, 1);
    const queryB = () => compiler.executeQuery(keyA, queryA, undefined, 1);

    try {
      compiler.executeQuery(keyA, queryA, undefined, 1);
      throw new Error('Did not throw');
    } catch (e: any) {
      expect(e).toBeInstanceOf(v6.QueryCycleError);
      expect(e.queryStack.length).toBeGreaterThan(0);
    }
  });

  it('should support generic AnalysisKey preservation registry', () => {
    const mockPass: v6.OptimizationPass = {
      name: 'MockPass',
      requires: new Set<v6.AnalysisKey<any>>([v6.CFGAnalysis]),
      preserves: new Set<v6.AnalysisKey<any>>([v6.CFGAnalysis, v6.DominatorsAnalysis]),
      invalidates: new Set<v6.AnalysisKey<any>>([v6.SSAAnalysis, v6.UseDefAnalysis])
    };
    expect(mockPass.preserves.has(v6.CFGAnalysis)).toBe(true);
    expect(mockPass.invalidates.has(v6.SSAAnalysis)).toBe(true);
  });

  it('should support LoopNormalizer pre-header guarantee', () => {
    const b0: v6.BasicBlock = { id: 0, instructions: [{ kind: 'Jump', targetBlockId: 1 }], successors: [1], predecessors: [] };
    const b1: v6.BasicBlock = { id: 1, instructions: [], successors: [2], predecessors: [0, 2, 4] };
    const b2: v6.BasicBlock = { id: 2, instructions: [{ kind: 'Jump', targetBlockId: 1 }], successors: [1], predecessors: [1] };
    const b4: v6.BasicBlock = { id: 4, instructions: [{ kind: 'Jump', targetBlockId: 1 }], successors: [1], predecessors: [] };

    const cfg = new v6.ControlFlowGraph(0, 2, new Map([[0, b0], [1, b1], [2, b2], [4, b4]]));
    const normalized = v6.LoopNormalizer.ensurePreHeader(cfg, new Set([1, 2]), 1);

    expect(normalized.preHeaderId).toBe(5);
    expect(normalized.cfg.blocks.has(5)).toBe(true);
  });

  it('should support LICM hoisting of invariant loop instructions', () => {
    const useDef = new v6.UseDefGraph();
    useDef.recordDef(1, 0);

    const b0: v6.BasicBlock = {
      id: 0,
      instructions: [{ kind: 'Jump', target: 1 }],
      successors: [1],
      predecessors: []
    };

    const b1: v6.BasicBlock = {
      id: 1,
      instructions: [
        { kind: 'Assign', target: 2, value: { kind: 'SSAValue', id: 1 } },
        { kind: 'Jump', target: 1 }
      ],
      successors: [1],
      predecessors: [0]
    };

    const cfg = new v6.ControlFlowGraph(0, 1, new Map([[0, b0], [1, b1]]));
    const optimized = v6.LICMOptimizer.hoistInvariants(cfg, new Set([1]), 0, useDef);

    const b0New = optimized.blocks.get(0)!;
    const b1New = optimized.blocks.get(1)!;

    expect(b0New.instructions.length).toBe(2);
    expect(b0New.instructions[0].kind).toBe('Assign');
    expect((b0New.instructions[0] as any).target).toBe(2);

    expect(b1New.instructions.length).toBe(1);
    expect(b1New.instructions[0].kind).toBe('Jump');
  });

  it('should support AnalysisManager cache operations', () => {
    const manager = new v6.AnalysisManager();
    const useDef = new v6.UseDefGraph();

    manager.set(v6.UseDefAnalysis, useDef);
    expect(manager.get(v6.UseDefAnalysis)).toBe(useDef);

    manager.invalidate(v6.UseDefAnalysis);
    expect(manager.get(v6.UseDefAnalysis)).toBeUndefined();
  });

  it('should support CFGVerifier and SSAVerifier validations', () => {
    const b0: v6.BasicBlock = {
      id: 0,
      instructions: [],
      successors: [1],
      predecessors: []
    };
    const b1: v6.BasicBlock = {
      id: 1,
      instructions: [],
      successors: [],
      predecessors: []
    };

    const cfg = new v6.ControlFlowGraph(0, 1, new Map([[0, b0], [1, b1]]));
    expect(() => v6.CFGVerifier.verify(cfg)).toThrow(/CFG Invariant violated/);
  });

  it('should support AnalysisManager transitive invalidation', () => {
    const manager = new v6.AnalysisManager();
    const cfg = new v6.ControlFlowGraph(0, 0, new Map());
    const dom = new v6.DominatorTree();

    manager.set(v6.CFGAnalysis, cfg);
    manager.set(v6.DominatorsAnalysis, dom);
    manager.registerDependency(v6.CFGAnalysis, v6.DominatorsAnalysis);

    expect(manager.get(v6.CFGAnalysis)).toBe(cfg);
    expect(manager.get(v6.DominatorsAnalysis)).toBe(dom);

    manager.invalidate(v6.CFGAnalysis);
    expect(manager.get(v6.CFGAnalysis)).toBeUndefined();
    expect(manager.get(v6.DominatorsAnalysis)).toBeUndefined();
  });

  it('should support SSAVerifier single definition validation', () => {
    const inst1: v6.Instruction = { kind: 'Assign', target: 5, value: { kind: 'Constant', value: 42 } };
    const inst2: v6.Instruction = { kind: 'Assign', target: 5, value: { kind: 'Constant', value: 100 } };

    const b0: v6.BasicBlock = {
      id: 0,
      instructions: [inst1, inst2],
      successors: [],
      predecessors: []
    };

    const cfg = new v6.ControlFlowGraph(0, 0, new Map([[0, b0]]));
    const dom = new v6.DominatorTree();

    expect(() => v6.SSAVerifier.verify(cfg, dom)).toThrow(/SSA value v5 is defined multiple times/);
  });

  it('should support SSAVerifier Phi placement validation', () => {
    const incoming = new Map<number, v6.Operand>();
    const phiInst: v6.Instruction = { kind: 'Phi', target: 6, incoming };
    const inst1: v6.Instruction = { kind: 'Assign', target: 5, value: { kind: 'Constant', value: 42 } };

    const b0: v6.BasicBlock = {
      id: 0,
      instructions: [inst1, phiInst],
      successors: [],
      predecessors: []
    };

    const cfg = new v6.ControlFlowGraph(0, 0, new Map([[0, b0]]));
    const dom = new v6.DominatorTree();

    expect(() => v6.SSAVerifier.verify(cfg, dom)).toThrow(/Phi instruction placed after non-Phi instruction/);
  });

  it('should support CFGVerifier entry block predecessor validation', () => {
    const b0: v6.BasicBlock = { id: 0, instructions: [{ kind: 'Jump', targetBlockId: 1 } as any], successors: [1], predecessors: [1] };
    const b1: v6.BasicBlock = { id: 1, instructions: [{ kind: 'Return' } as any], successors: [], predecessors: [0] };

    const cfg = new v6.ControlFlowGraph(0, 1, new Map([[0, b0], [1, b1]]));
    expect(() => v6.CFGVerifier.verify(cfg)).toThrow(/entry block 0 has predecessor blocks/);
  });

  it('should support CFGVerifier exit block successor validation', () => {
    const b0: v6.BasicBlock = { id: 0, instructions: [{ kind: 'Jump', targetBlockId: 1 } as any], successors: [1], predecessors: [] };
    const b1: v6.BasicBlock = { id: 1, instructions: [{ kind: 'Return' } as any], successors: [0], predecessors: [0] };

    const cfg = new v6.ControlFlowGraph(0, 1, new Map([[0, b0], [1, b1]]));
    expect(() => v6.CFGVerifier.verify(cfg)).toThrow(/exit block 1 has successor blocks/);
  });

  it('should support CFGVerifier instruction after terminator check', () => {
    const b0: v6.BasicBlock = {
      id: 0,
      instructions: [
        { kind: 'Jump', targetBlockId: 1 } as any,
        { kind: 'Assign', target: 5, value: { kind: 'Constant', value: 42 } }
      ],
      successors: [1],
      predecessors: []
    };
    const b1: v6.BasicBlock = { id: 1, instructions: [{ kind: 'Return' } as any], successors: [], predecessors: [0] };

    const cfg = new v6.ControlFlowGraph(0, 1, new Map([[0, b0], [1, b1]]));
    expect(() => v6.CFGVerifier.verify(cfg)).toThrow(/terminator instruction is not the last/);
  });

  it('should support SSAVerifier Phi incoming predecessor mismatch', () => {
    const incoming = new Map<number, v6.Operand>();
    incoming.set(2, { kind: 'Constant', value: 42 }); // block 2 is not a predecessor of block 1
    const phiInst: v6.Instruction = { kind: 'Phi', target: 6, incoming };

    const b0: v6.BasicBlock = { id: 0, instructions: [{ kind: 'Jump', targetBlockId: 1 } as any], successors: [1], predecessors: [] };
    const b1: v6.BasicBlock = { id: 1, instructions: [phiInst, { kind: 'Return' } as any], successors: [], predecessors: [0] };

    const cfg = new v6.ControlFlowGraph(0, 1, new Map([[0, b0], [1, b1]]));
    const dom = new v6.DominatorTree();
    dom.compute(cfg);

    expect(() => v6.SSAVerifier.verify(cfg, dom)).toThrow(/Phi incoming predecessor 2 is not a predecessor of block 1/);
  });

  it('should support SSAVerifier dominance check validation', () => {
    // block 1 defines v5, but block 0 uses v5 without being dominated by block 1
    const b0: v6.BasicBlock = {
      id: 0,
      instructions: [
        { kind: 'Assign', target: 6, value: { kind: 'SSAValue', id: 5 } },
        { kind: 'Return' } as any
      ],
      successors: [],
      predecessors: []
    };
    const b1: v6.BasicBlock = {
      id: 1,
      instructions: [
        { kind: 'Assign', target: 5, value: { kind: 'Constant', value: 42 } },
        { kind: 'Return' } as any
      ],
      successors: [],
      predecessors: []
    };

    const cfg = new v6.ControlFlowGraph(0, 0, new Map([[0, b0], [1, b1]]));
    const dom = new v6.DominatorTree();
    dom.compute(cfg);

    expect(() => v6.SSAVerifier.verify(cfg, dom)).toThrow(/is not dominated by its definition block/);
  });

  it('should support VerifierManager verifiers execution', () => {
    const manager = new v6.VerifierManager();
    manager.register(new v6.CFGVerifier());
    manager.register(new v6.SSAVerifier());

    const b0: v6.BasicBlock = { id: 0, instructions: [{ kind: 'Return' } as any], successors: [], predecessors: [] };
    const cfg = new v6.ControlFlowGraph(0, 0, new Map([[0, b0]]));
    const dom = new v6.DominatorTree();
    dom.compute(cfg);

    expect(() => manager.verifyAll({ cfg, dom })).not.toThrow();
  });

  it('should support AnalysisManager collectDependents transitive sweep', () => {
    const manager = new v6.AnalysisManager();
    manager.registerDependency(v6.CFGAnalysis, v6.DominatorsAnalysis);
    manager.registerDependency(v6.DominatorsAnalysis, v6.LoopInfoAnalysis);

    const dependents = manager.collectDependents(v6.CFGAnalysis);
    expect(dependents.has(v6.CFGAnalysis)).toBe(true);
    expect(dependents.has(v6.DominatorsAnalysis)).toBe(true);
    expect(dependents.has(v6.LoopInfoAnalysis)).toBe(true);
  });

  it('should support EffectAnalysis compile-time interface implementation', () => {
    const myAnalysis: v6.EffectAnalysis = {
      isSpeculatable(inst) {
        return false;
      }
    };
    expect(myAnalysis.isSpeculatable({ kind: 'Assign', target: 5, value: { kind: 'Constant', value: 42 } })).toBe(false);
  });

  it('should support FIFOQueue stress test and compaction', () => {
    const queue = new v6.FIFOQueue<number>();
    for (let i = 0; i < 100000; i++) {
      queue.enqueue(i);
    }
    expect(queue.length).toBe(100000);

    for (let i = 0; i < 75000; i++) {
      expect(queue.dequeue()).toBe(i);
    }
    expect(queue.length).toBe(25000);

    queue.enqueue(9999);
    expect(queue.length).toBe(25001);
  });

  it('should support Diamond dependency invalidation without redundant visits', () => {
    const manager = new v6.AnalysisManager();
    manager.registerDependency(v6.CFGAnalysis, v6.DominatorsAnalysis);
    manager.registerDependency(v6.CFGAnalysis, v6.LoopInfoAnalysis);
    manager.registerDependency(v6.DominatorsAnalysis, v6.SSAAnalysis);
    manager.registerDependency(v6.LoopInfoAnalysis, v6.SSAAnalysis);

    const dependents = manager.collectDependents(v6.CFGAnalysis);
    expect(dependents.size).toBe(4);
    expect(dependents.has(v6.CFGAnalysis)).toBe(true);
    expect(dependents.has(v6.DominatorsAnalysis)).toBe(true);
    expect(dependents.has(v6.LoopInfoAnalysis)).toBe(true);
    expect(dependents.has(v6.SSAAnalysis)).toBe(true);
  });

  it('should support VerifierManager error aggregation behavior', () => {
    class DummyVerifier1 extends v6.Verifier {
      readonly phase = v6.VerifierPhase.PreOptimization;
      verify() {
        throw new Error("Failure 1");
      }
    }
    class DummyVerifier2 extends v6.Verifier {
      readonly phase = v6.VerifierPhase.PreOptimization;
      verify() {
        throw new Error("Failure 2");
      }
    }

    const manager = new v6.VerifierManager();
    manager.register(new DummyVerifier1());
    manager.register(new DummyVerifier2());

    const b0: v6.BasicBlock = { id: 0, instructions: [{ kind: 'Return' } as any], successors: [], predecessors: [] };
    const cfg = new v6.ControlFlowGraph(0, 0, new Map([[0, b0]]));

    expect(() => manager.runPhase(v6.VerifierPhase.PreOptimization, { cfg })).toThrow(/Failure 1; Failure 2/);
  });

  it('should support PHP code parsing and Laravel Eloquent model/accessor type resolution', () => {
    const kernel = new SemanticResolutionKernel();

    // Register a mock Eloquent model "Product" into the resolution kernel
    kernel.loadGraph({
      services: {},
      controllers: {},
      models: {
        Product: {
          kind: 'model_node',
          name: 'Product',
          layer: 'model',
          confidence: 1.0,
          fields: {
            id: { type: 'number', nullable: false },
            name: { type: 'string', nullable: false },
            price: { type: 'number', nullable: false },
            discounted_price: { type: 'number', nullable: true }
          },
          relations: {
            category: { type: 'BelongsTo', model: 'Category' }
          }
        } as any,
        Category: {
          kind: 'model_node',
          name: 'Category',
          layer: 'model',
          confidence: 1.0,
          fields: {
            id: { type: 'number', nullable: false },
            title: { type: 'string', nullable: false }
          },
          relations: {}
        } as any
      },
      edges: []
    });

    // 1. Test parsing simple property access expression: $this->price
    const priceAST = PhpCodeParser.parseExpression('$this->price');
    expect(priceAST.kind).toBe('property_access');
    
    // Resolve type of $this->price under context of Product model
    const priceResolution = kernel.resolve(priceAST, { fileName: 'Product' });
    expect(priceResolution.status).toBe('resolved');
    expect(priceResolution.type).toBe('number');

    // 2. Test parsing relation traversal: $this->category->title
    const categoryTitleAST = PhpCodeParser.parseExpression('$this->category->title');
    expect(categoryTitleAST.kind).toBe('property_access');
    
    const categoryTitleResolution = kernel.resolve(categoryTitleAST, { fileName: 'Product' });
    expect(categoryTitleResolution.status).toBe('resolved');
    expect(categoryTitleResolution.type).toBe('string');

    // 3. Test parsing non-existent property fallback
    const missingAST = PhpCodeParser.parseExpression('$this->non_existent');
    const missingResolution = kernel.resolve(missingAST, { fileName: 'Product' });
    expect(missingResolution.status).toBe('unknown');
  });
});
