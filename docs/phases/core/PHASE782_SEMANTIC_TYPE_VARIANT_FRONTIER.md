# Phase 782 — Semantic Type Variant Frontier

## Diagnostic frontier

The previous build frontier in `dependencyGraph.ts` was corrected in Phase 781 by replacing nested relation projection with relation expansion for dependency closure.

Phase 782 continues the same model elevation into the semantic type system. Several semantic-type consumers still used host-language `as Extract<SemanticType, ...>` casts after checking `kind`. Those casts made the closed SemanticType ADT depend on an external narrowing assertion.

## Model elevation

The following consumers now use the canonical `relationVariantFold` semantic narrowing relation:

- `compiler/types/system/subtypingChecker.ts`
- `compiler/types/system/assignabilityChecker.ts`
- `compiler/domain/common/semantic-resolver/compoundHandlers.ts`
- `compiler/scanner/subscanners/request-deriver/responseDeriver.ts`

The semantic meaning is unchanged, but the authority is raised:

`SemanticType closed ADT -> relation variant judgment -> typed branch witness -> semantic operation`

instead of:

`SemanticType kind comparison -> host cast -> semantic operation`.

Reference hierarchy traversal also now refines the parent through the relation variant algebra. No duplicate descriptor is introduced.

## Audits

- `audit-phase782-semantic-type-variant-frontier.cjs`: all PASS
- `audit-phase781-dependency-relation-frontier.cjs`: all PASS
- `audit-phase525-inactive-file-vacuum.cjs`: all PASS; no inactive non-test TypeScript candidates

The assistant sandbox did not have a complete installed dependency tree for a full `npm run build`; the user's workspace remains the build oracle. No diagnostic was suppressed or cast around.
