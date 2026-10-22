# Phase 1962 — AST Classifier ADT Correlation, Interface First

## Trace

Phase 1961 restored one syntax-classifier port with closed request/result ADTs, but its single union signature erased the request/result correlation at the call site. The facade then rechecked the returned discriminant and threw if an expression request returned a block result (or vice versa).

## Interface correction

- Preserved the existing `AstClassifierEvidenceInterface.classify` single port.
- Added overload correlation: expression request → expression result; block request → block result.
- Matched the runtime implementation overloads to the upstream contract.
- Removed facade-level mismatch reclassification; typed convenience projections now consume the correlated result type directly.
- Removed the facade's two imports from `semantic/relations` for source token filtering. No `semantic/foundation` dependency was added.
- Kept semantic evidence production in `AstSemanticEvidenceProducerInterface` / `AstSemanticStageInterface` and kept Laravel invocation judgment + inventory closure unchanged.

## Exclusions

No relation/foundation subscanner was created. This change does not claim that all other scanner submodules are free of existing `semantic/relations` imports; those require their own caller-by-caller interface trace before removal. No parallel semantic authority or invocation judgment model was introduced.

## Verification boundary

The static audit checks the upstream ADT correlation, runtime overloads, lack of facade relation/foundation imports, and preservation of the existing invocation judgment and inventory boundaries. TypeScript build and Vitest are not claimed as run.
