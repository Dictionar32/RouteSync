# Phase 2039 — Assignment Array-Access Malformed Judgment, Interface First

## Trace finding

The upstream `ScannerAssignmentTargetInterface` already returned a closed `AssignmentTargetJudgment`, but its `classifyArrayAccess` evidence callback only allowed `resolved | unresolved`. In the runtime, malformed trailing-delimiter evidence was thrown as `AstSourceJudgmentFailureError` before the assignment-target authority could close the result. That split the judgment boundary: malformed source was treated as an exception side channel instead of a first-class result of the existing interface.

## Change

- Extended `AssignmentTargetEvidenceJudgment<Evidence, Token>` with a `malformed` variant carrying the original `TokenEvidenceLocation<Token>`, expected token, and actual token.
- Updated the existing `ScannerAssignmentTargetInterface` callback to bind malformed evidence to the same source token type.
- Updated the canonical assignment-target algebra to propagate malformed array-access evidence into its existing `AssignmentTargetJudgment`.
- Changed runtime `classifyArrayAccess` to return the existing evidence ADT directly. It no longer wraps the result in `RelationOption` and no longer throws for malformed delimiter evidence.
- Kept the existing AST source failure boundary responsible for forwarding the final malformed assignment-target judgment to its caller.

## Architecture

This is an evolution of the existing assignment-target interface, not a new authority or subscanner. The data path is:

`token delimiter judgment → AssignmentTargetEvidenceJudgment → ScannerAssignmentTargetInterface → AssignmentTargetJudgment → AST source-failure boundary`

The Laravel invocation semantic judgment and integrated response wiring are unchanged. No `relation/foundation` subscanner was introduced.

## Verification boundary

The Phase 2039 audit checks source-level contract shape and wiring. It does not establish a full TypeScript type-check or monorepo build. Those are intentionally not run in this environment.
