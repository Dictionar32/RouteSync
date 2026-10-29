# Phase 3081 changelog

- Changed source-read batch accumulation from a single accumulator with a rejection-count decision to a closed union of open and rejected domain states.
- First rejection transitions the batch into a rejected state; the state cannot become fulfilled again.
- Removed the `rejected.length === 0` terminal decision.
- Preserved interface-first runtime factory export, source identity inventory, normalized failure evidence, and existing CLI manifest boundary.
- Added structural audit: 12/12 checks pass.
- Left generic batch continuation, index traversal, strict workspace typecheck, full test suite, and end-to-end runtime validation explicitly open.
