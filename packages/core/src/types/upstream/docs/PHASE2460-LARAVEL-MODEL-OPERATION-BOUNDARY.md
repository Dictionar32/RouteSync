# Phase2460 — Laravel Model Operation Boundary

The existing `LaravelModelScannerInterface` remains the only public operation boundary for model scanning. `scanModelBundle` is now an internal implementation detail; the unused `scanModelAsts` export and `resolveModelColumns` re-export were removed from the canonical scanner module. The active pipeline still injects `laravelModelScanner` directly.

This change deliberately does not claim full helper migration. Twelve files in `compiler/scanner/subscanners/model` still import `semantic/relations`; no direct `semantic/foundation` imports were found in that scanned subset. Transitive foundation usage across the whole Laravel CLI path remains unverified.

`parseModelPropertyAsts` remains an exported free function without a dedicated upstream operation contract. A contract must not import compiler-owned lexer types upward; establish/reuse the upstream lexical vocabulary first, then type the parser operation against that boundary. The rewrite passed TypeScript syntax transpilation, but no direct behavioral test suite for this parser was found, so semantic equivalence is not claimed.
