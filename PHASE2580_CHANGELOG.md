# RouteSync Phase 2580 — Source Occurrence Canonical Location

## Fixed

The source-occurrence guard previously treated input membership and location consistency as independent checks. If evidence did not belong to the canonical input, the location check could still construct its expected location from the same rejected evidence and report a second, misleading failure. Route locations were also compared by span without comparing the explicit file and line fields.

## Implementation

- Replaced the boolean-only membership check with a closed `SourceOccurrenceInputMembership` ADT.
- Membership matching uses canonical semantic identity and exact source coordinates for routes, resources, and requests.
- A missing input occurrence emits the canonical `source_occurrence_belongs_to_input` counterexample with candidate locations.
- Location consistency is evaluated only for an occurrence matched to the canonical input and compares against that input's location.
- Route location equality compares file, line, and full declaration span.
- Updated stale historical audits to follow the current preflight packet and membership operation.

## Validation

- 31 audit scripts passed, 406/406 explicit assertions.
- Phase 2580 audit: 12/12.
- TypeScript syntax transpilation passed for the changed verifier and contract files checked by the audit scripts.
- `package.json` parsing passed.
- Full typecheck, package build, Vitest, and CLI end-to-end tests were not run; this snapshot has no `node_modules` directory.
