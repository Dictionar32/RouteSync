# Phase 1415 — AST classifier rule algebra migration

## What changed

This phase changes ownership of the expression-classifier decision topology, not merely its file location. `astClassifierRuntime.ts` still defines PHP-specific grammar recognizers and AST constructors, but it no longer projects candidate rules, selects the first applicable candidate, or owns that resolution algorithm. It supplies an ordered rule catalog to `types/upstream/astClassifierRuleAlgebra.ts`.

The upstream algebra is generic and language-agnostic: it projects each rule to a result, selects the first result with a presence witness, and returns the selected relation result. It has no dependency on PHP tokens, PHP syntax spellings, or PHP AST nodes. The closed request/result contract remains the public syntax port; the evidence producer remains separate from syntax parsing.

## Trace

`tokenizer / token stream → PHP grammar-specific rule catalog → AstClassificationRule<Input, Output> → astClassificationRuleAlgebra.resolveFirst → PhpAstValue → scanner-facing closed port → source model`.

The rule catalog is still PHP-specific, and the large statement parser (`parseBlock`) remains in the runtime module. Moving PHP grammar recognizers wholesale into an interface would invert the boundary: an interface should define the algebra/contract, while grammar-specific rules implement it. Those remaining recognizers are the next migration boundary and must be moved rule family by rule family with consumer/test parity.

## Validation

Run `npm run audit:phase1415-ast-classifier-algebra`. The audit checks ownership of candidate evaluation and selection, language independence, contract continuity, and build-script preservation. Full build was not claimed unless `tsdown` and dependencies are installed and the build actually runs.
