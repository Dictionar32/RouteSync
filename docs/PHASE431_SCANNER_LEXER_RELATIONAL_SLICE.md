# Phase 431 — Scanner/Lexer Relational Slice Authority

## Objective
Remove direct `slice()` collection/string slicing and remaining positional `index + 1` arithmetic from the lexer AST-classification authority.

## Architecture
The lexer authority now delegates sequence/string projection to declarative kernel relations:

- `relationSlice` for token/sequence projection
- `relationTextSlice` for string projection
- `relationAdvanceIndex` for positional advancement

The scanner layer therefore describes semantic projection through relation primitives instead of direct collection slicing or positional arithmetic.

## Validation
- `astClassifierEvidence.ts` direct `.slice(`: 0
- target positional `index + N`: 0
- TypeScript `transpileModule`: 0 diagnostics
- PHP token spellings such as `===`, `&&`, `||`, `??` remain data vocabulary where required; they are not treated as implementation control flow.

## Research basis
The architecture follows the declarative match/constraint/rewrite direction documented by MLIR PDLL/PDL and DRR, and the relational/equality-saturation direction represented by egglog. The goal is semantic authority as relations and rewrite rules, not syntactic substitution of one imperative construct for another.
