# Phase 1935 — Controller Payload Source Identity Closure (Interface First)

## Trace finding
Phase 1934 validated the canonical source against the invocation judgment and semantic-knowledge projection, but the source payload collection could still contain a payload whose `source.file` differs from the canonical source. The correspondence authority would then treat it as a missing binding correspondence rather than rejecting a malformed cross-file evidence bundle.

## Contract-first correction
- Extended the existing `ControllerDataflowSemanticJudgmentAuthorityContract` with `payloadSourceIdentityClosure`; authority contract version is now 9.
- The existing upstream `laravelSourceIdentitySemantics.relateSourceFiles` relation validates every `statementPayloads[*].source.file` before binding correspondence, variable identity resolution, variable-flow composition, or integrated-response publication.
- Updated the semantic model contract to version 7 and Laravel scanner boundary to version 97.
- Scanner remains evidence-only and does not own the validation. No parallel authority or `semantic/foundation` dependency was introduced.

## Verification
The Phase 1935 audit checks the new invariant and prior phase audits are version-aligned. These are static source audits; TypeScript build and full tests were not run.
