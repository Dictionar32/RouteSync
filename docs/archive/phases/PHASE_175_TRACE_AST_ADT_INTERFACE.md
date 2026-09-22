# Phase 175 — Trace AST/ADT Interface

## Focus
Elevate relation-load selection so malformed selection syntax cannot silently become a valid `all` selection.

## Trace
Previous flow:

`raw relation-load string -> split -> optional selection -> ResourceRelationLoadTarget`

The previous target parser could erase the distinction between an empty/invalid selection and a valid selection.

## Interface elevation
Introduced `ResourceRelationLoadSelectionParts`:

- `properties { values }`
- `invalid { reason: empty_selection }`

`ResourceRelationLoadTargetParts.path_with_selection` now carries this semantic selection part instead of a raw string.

`parseResourceRelationLoadTarget()` now returns `ResourceRelationLoadTargetResolution`:

- `resolved { target }`
- `invalid { reason: empty_selection }`

The resolver boundary converts invalid target resolution into the existing `ResourceRelationLoadArguments.invalid` vocabulary rather than fabricating a valid target.

## Downstream effect
Downstream consumers receive:

`ResourceRelationLoadTargetResolution -> ResourceRelationLoadTarget`

or an explicit invalid semantic reason.

They no longer need to infer whether an empty selection means `all`.

## Validation
Command:

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Only pre-existing environment blocker remains:

`packages/core/src/compiler/utils/Hash.ts(4,28): TS2307 Cannot find module 'crypto'`

No new TypeScript errors introduced by Phase 175.

## Next trace target
Audit other raw-to-semantic parsers for the same class of semantic collapse, especially comparison-operator registry lookup and collection/arity resolution. Elevate only where the existing interface can carry the missing meaning; do not create parallel models unnecessarily.
