# Scanner/Resolver Research — Phase 398

## Research direction

The research target is not syntactic substitution. The target is a semantic kernel in which parser evidence feeds typed relations, constraints, closure, fixed-point evaluation, and rewrite/projection stages.

### Relevant external patterns

- **MLIR PDLL**: declarative pattern matching with explicit constraints and rewrite sections. citeturn0search2
- **egglog**: equality saturation combined with Datalog. citeturn0search0
- **Soufflé**: typed relations and rule-based derivation. citeturn0search1turn0search5
- **JastAdd**: circular attributes evaluated iteratively to convergence, with monotonic finite-height lattices recommended for convergence. citeturn0search4
- **Eqlog**: Datalog with equality plus congruence closure, showing another route for combining relational derivation and equality reasoning. citeturn0search6

## RouteSync implication

Scanner and resolver code should progressively become evidence producers and relation adapters. The generic semantic solver/rewrite engine should own selection, closure, equality, recurrence, and canonical projection.

A migration is considered valid only when:

1. token recognition remains intact;
2. semantic selection is expressed through relation witnesses or rules;
3. absence is represented through explicit relation options/presence witnesses rather than host-language absence sentinels;
4. traversal is recursive relation closure or solver iteration;
5. equality used for semantic decisions is routed through the relation kernel;
6. the migration preserves the public AST/result contract;
7. validation records both local eradication and whole-scanner residual pressure.

## Phase 398 target

`packages/core/src/compiler/scanner/lexer/arrayParser.ts` was selected because it contained imperative token scans for array opening, nested depth, key/value segmentation, and scalar-expression extent. Those operations now use relation closure while preserving the existing `ParsedPhpArrayResult` contract.
