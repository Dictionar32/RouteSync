# Phase 3077 changelog

- Replaced generic `continueWith<Result>` on individual PHP source-read settlements with `contributeToBatch`.
- Added a typed source-read batch accumulator with explicit fulfilled, rejected, and finish operations.
- Preserved source-read ordering, source identity, normalized rejection evidence, and existing manifest terminal behavior.
- Added a structural audit and npm script for the new domain operation.
- Kept the existing CLI manifest boundary and dependency direction unchanged.
