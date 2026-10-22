# Phase 2157 Changelog

- Changed the existing controller body semantic authority input from pre-resolved body output to typed source AST evidence.
- Moved inline validation entry lowering, source provenance construction, schema lowering input, and known error status interpretation into the existing authority implementation.
- Reduced the legacy body resolver module to a compiler-side evidence projection type; removed its validation/error semantic derivation.
- Updated the authority interface and implementation contract to version 5.
- Preserved invocation/integrated-response, request-binding, and resource-binding ownership boundaries.
