# Phase 427 — Scanner Resolver Relational Route-Group Authority

## Scope
Moved `routeGroupSemanticResolver.ts` semantic assembly from host-language branching and collection methods to the relational semantic kernel.

## Cutover
- prefix presence: `relationGate`
- prefix/name projection: `relationProject`
- middleware/constraint sequence construction: relational cursor recursion
- positional advancement: `relationAdvanceIndex`
- controller/domain absence branching: `relationGate`
- removed resolver-local `if`, `.map`, `.reduce`, and positional `index + 1` from the target authority.

## Validation
- TypeScript `transpileModule`: 0 diagnostics for target.
- The repository-wide scanner still contains legacy constructs in other files; this phase does not claim a global zero count.
- PHP vocabulary strings such as `===`, `&&`, `||`, and `??` remain data where they represent source-language tokens.

## Design basis
The migration follows declarative pattern/rewrite and relation-centric computation: MLIR PDLL/PDL represents matching and rewriting as an explicit pattern IR; MLIR DRR expresses source/result patterns plus constraints; egglog combines equality saturation and Datalog; JastAdd expresses iterative fixed-point computation declaratively through circular attributes.
