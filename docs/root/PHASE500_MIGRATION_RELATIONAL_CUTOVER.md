# RouteSync Phase 500 — Migration Relational Cutover

Phase 500 continues the scanner/lexer resolver migration from syntax-driven authority toward declarative semantic relations and solver/rewrite-oriented execution.

## Closed surface

`packages/core/src/compiler/scanner/subscanners/migrationProducer.ts` was migrated away from host-language parser control constructs and absence sentinels. Token traversal is expressed as recursive relation closure, selection is represented with relation options, and collection construction uses recursive relation projection/sequence construction.

The migration producer now models:

- token lookup as relation options;
- schema/body discovery as recursive relation traversal;
- column/index/foreign-key evidence as relational selections;
- database-type and semantic-type resolution as candidate relations;
- optional names and arguments as explicit relation absence/presence;
- sequence construction as recursive semantic sequence assembly.

## Research alignment

The design follows the same higher-level separation seen in:

- Statix: constraints + scope-graph based semantic resolution;
- Rascal: extracted facts, enrichment/transitive closure, constraint solving and rewriting;
- MLIR PDLL/PDL: declarative match/rewrite separation;
- Flix: fixpoint computation over relational constraints;
- egglog: Datalog relations combined with equality-saturation rewriting.

## Validation

Run:

`npm run audit:scanner-lexer:phase500`

The Phase 500 closed surface audit reports zero forbidden constructs for the closed files.

A full TypeScript typecheck remains environment-blocked because the workspace does not currently provide the `node` and `vitest/globals` type definitions required by the repository tsconfig.

## Next frontier

After migration producer closure, the dominant scanner/resolver frontier is `serviceAstCanonical.ts`, followed by `controllerDataflowContract.ts` and `serviceSourceStatements.ts`.
