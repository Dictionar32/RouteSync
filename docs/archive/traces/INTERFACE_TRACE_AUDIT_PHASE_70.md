# Interface Trace Audit - Phase 70

## Target
Eliminate `null` as semantic state from the domain interfaces. Absence/presence is represented by closed ADTs.

## Changes
- Response wrapper: `ResponseWrapperKey` (`no_wrapper | data_wrapper`).
- Pagination links: `ResponseLinksKeySpecification` (`no_links_key | links_key`).
- Bound cast: `BoundCastType` (`no_cast | cast`).
- Bound model target: `BoundTargetModel` (`unbound | model`).
- Request file constraints: `FileConstraintPresence` (`none | present`).

## Scope
Interface-only. Producer, constructors, scanners, consumers and runtime flow are intentionally not migrated in this phase.

## Invariant
No targeted semantic interface uses `| null` for absence. Absence is a named domain state and therefore remains visible to downstream consumers without null interpretation.
