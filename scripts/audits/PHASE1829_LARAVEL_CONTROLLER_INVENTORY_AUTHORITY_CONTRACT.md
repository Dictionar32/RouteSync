# Phase 1829 — Laravel Controller Inventory Authority Contract

## Interface-first sequence

1. Tighten the inventory interface before implementing the authority: the completeness witness now carries the exact `SourceProjectIdentity`, and the contract requires the witness to match the inventory's project identity.
2. Add typed rejection variants for project-binding mismatch and malformed completeness evidence.
3. Implement the declared authority interface using the existing relational operations. The implementation checks the ordered witness obligations, duplicate canonical source identities, missing/multiple judgments, and orphan judgments. A non-empty typed ledger rejects the whole inventory; only the no-rejection branch produces the closure receipt.
4. Keep the scanner boundary receipt-only. The scanner does not reconstruct correspondence or repair an inventory.
5. Trace the production wiring separately. `laravelSourceAstPipeline.ts` still calls `ControllerScanner.scanCanonicalBundle`; route/resource consumers still depend on the legacy controller index. No production migration or subscanner deletion is claimed in this phase.

## Constraints

- No `if` statements, `Map`/`Set`, or type assertions were introduced in the new authority implementation.
- The authority uses the existing relational operation vocabulary instead of creating a second source-judgment lookup layer.
- The integrated response remains inside `LaravelControllerInvocationSemanticJudgmentInterface`; `complete`, `blocked`, `source_binding_rejected`, and `not_connected` are not reclassified by the inventory authority.
- Build, typecheck, and E2E are not run in this phase. The phase audit is a static contract/path audit only.

## External references

- TypeScript discriminated unions and exhaustiveness: https://www.typescriptlang.org/docs/handbook/2/narrowing
- TypeScript unions and intersection types: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
- PHP-Parser token positions and AST source offsets: https://github.com/nikic/PHP-Parser/blob/master/doc/component/Lexer.markdown
