# Phase 661 — AST Stage Contract Frontier Audit

## Elevation

Phase 660 established closed stage-specific AST semantic ports. Phase 661 raises that port model into a typed stage-contract graph.

The contract is now explicit for every semantic boundary:

`source syntax -> scanner evidence -> upstream mapping -> resolver graph -> analysis -> semantic type lowering -> target projection`

Every stage port carries:

- a closed stage identity;
- a stage-specific relation vocabulary;
- a legal predecessor and successor boundary;
- least-fixed-point closure as the semantic evaluation model;
- `semantic_rewrite_engine` as the derivation authority;
- `ast_semantic_judgment` as the semantic authority;
- a closed contract marker.

## Why this is higher than a cleanup

The architecture no longer treats a stage port as a typed bag of facts only. The port now carries the contract that states what relations are legal and where the stage is allowed to sit in the semantic pipeline.

This follows the same architectural direction visible in MLIR interfaces and dialect conversion: transformations are expressed against contracts and rewrite patterns rather than hard-coded knowledge of every concrete operation. citeturn0search2turn0search0

The stage graph also follows the contract-oriented separation found in WebAssembly WIT, where interfaces define composable typed contracts between components. citeturn0search4turn0search10

Resolution remains graph-shaped, following scope-graph ideas from Statix/Spoofax, while the derivation layer remains rule/rewrite based in the style of K and relational fixed-point systems. citeturn0search1turn0search6turn0search3

## Legacy authority vacuum

The following legacy semantic authorities remain zero-byte:

- `semanticRelationSolver.ts`
- `syntaxErrorRelationCore.ts`
- `requirementSolver.ts`

The inactive-file vacuum audit reports no remaining non-test inactive TypeScript candidates.

## Frontier discipline

Source-language constructs such as PHP `if`, `while`, `for`, `switch`, ternary and `??` remain valid scanner vocabulary when represented as source evidence. They are not treated as semantic control primitives. Their meaning must cross into the closed AST judgment algebra and declarative relation/rewrite engine.

The next elevation is therefore not mechanical removal of source tokens. It is to require every scanner, resolver, analysis, and semantic-type producer to emit a stage judgment whose derivation can be replayed from relation facts and rewrite rules.

## Verification

- Phase 661 stage-contract audit: PASS
- inactive-file vacuum: PASS
- targeted TypeScript transpilation: PASS
- workspace-wide `tsc --noEmit`: blocked by missing `@types/node` and `vitest/globals` definitions in the current environment.
