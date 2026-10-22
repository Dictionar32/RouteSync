# RouteSync Phase 2574 — Request Identity Kind Separation

## Scope

This phase fixes a semantic identity collision in the upstream RequestType source-evidence inventory. It does not claim to implement the full RequestType semantic producer or the 32-law proof verifier.

## Root cause

`RequestSourceIdentity` is a closed union:

- `http_request_identity` carries a request name.
- `form_request_identity` carries a request name and a concrete form type.

The previous `canonicalRequestIdentity` reduced both variants to `request:<name>`. Therefore an HTTP request and a FormRequest sharing the same name collapsed to the same semantic key. This discarded a source-domain distinction before request resolution and proof verification could reason about it.

## Change

1. Evolved the existing `RequestTypeCanonicalRequestIdentity` into a discriminated union that retains `identityKind` and, for FormRequest, `formType`.
2. Updated the existing named operation `canonicalRequestIdentity` to exhaustively handle both upstream identity variants.
3. HTTP request keys now include the HTTP identity tag and encoded request name.
4. FormRequest keys now include the FormRequest identity tag, encoded request name, and encoded concrete form type.
5. Updated the source-occurrence verifier to check the canonical identity kind in addition to request name and semantic key.
6. Kept the request-resolution operation's cardinality policy intact: name-based matching still reports ambiguity rather than inventing a fallback.

## Active path

`CLI scan/sync → manifest composition → source AST → canonical source evidence inventory → request resolution / semantic pipeline → judgment verification → manifest projection`

This change improves the identity supplied to the existing upstream path; it does not fill the missing production reasoning/verifier capabilities.

## Validation

`node scripts/audits/audit-phase2574-request-identity-kind-separation.cjs`

Result: 11/11 assertions passed, including TypeScript syntax transpilation for the changed contract, inventory, and verifier files.

Additional available prior-phase audits were run and passed: Phase 2552, 2556, 2557, 2560, 2561, 2567, 2569, 2570, 2571, 2572, and 2573.

Some earlier phase audit script files are not present in this source snapshot; they were not counted as executed. Full TypeScript typecheck, package build, Vitest, and CLI end-to-end tests were not run. The static audit does not substitute for those checks.

## Remaining blocker

A complete production RequestType semantic reasoning capability and an independent verifier that actually checks all 32 derivation laws remain absent. Do not wrap legacy `RequestType[]` output into a proof-backed judgment. The next substantial implementation should build evidence-driven reasoning and verification behind the existing upstream interfaces, then wire them through the existing assembler and CLI composition.
