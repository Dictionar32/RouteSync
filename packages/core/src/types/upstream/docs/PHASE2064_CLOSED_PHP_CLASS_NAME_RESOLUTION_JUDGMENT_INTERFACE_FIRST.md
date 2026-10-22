# Phase 2064 — Closed PHP Class-Name Resolution Judgment, Interface First

## Trace finding

Phase 2063 unified lexical name resolution across controller inheritance and static-call/model identity. The follow-up trace found that the shared authority's ADT already declared `malformed_class_name`, but the authority did not produce that outcome. Empty and repeated-separator spellings could therefore be projected into a nominal qualified name instead of being rejected as invalid lexical evidence.

## Change

- The existing `phpClassNameResolutionAuthority` now closes empty names, separator-only names, and names containing empty path segments as `php_class_name_resolution_blocked` with reason `malformed_class_name`.
- Validation occurs before fully-qualified, namespace-relative, import-alias, or current-namespace resolution.
- Added regression cases for empty input, a lone namespace separator, a repeated separator, and an empty namespace-relative suffix.
- Kept the same `PhpClassNameResolutionRuleInterface` and `PhpClassNameResolution` ADT; no second resolver or parallel malformed-name contract was introduced.
- Kept inheritance and static-call/model identity on the same upstream authority.
- Kept invocation semantic judgment, integrated response, AST/ADT projection, and runtime executor as existing downstream contracts. This phase does not add another invocation, response, AST, relation, or foundation authority/subscanner.

## Semantic boundary

`lexical source evidence → PhpClassNameResolutionInput → one upstream judgment authority → resolved-or-blocked ADT → inheritance/static-call consumers`.

The authority rejects only unambiguously malformed path shapes at this phase. It does not attempt to duplicate the complete PHP lexer/parser or assert that every syntactically plausible class exists.

## Verification scope

The Phase 2064 audit is structural. It does not claim that full TypeScript typecheck, build, or Vitest passed.

## Reference basis

PHP's official name-resolution rules define fully-qualified and namespace-relative forms and explain import/current-namespace lookup. MLIR's official interface documentation motivates having compiler analyses consume shared semantic contracts rather than reimplement special cases.
