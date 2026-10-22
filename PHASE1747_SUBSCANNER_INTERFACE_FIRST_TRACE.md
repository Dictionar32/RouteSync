# Phase 1747 — Subscanner Interface-First Trace and Invocation Boundary Truthfulness

## Scope

This phase corrects the Laravel controller invocation boundary contract before attempting further scanner wiring. It also traces the six Laravel subscanner interfaces against their concrete implementations. No package build is run.

## Interface correction

`LaravelControllerInvocationSemanticBoundaryContract` advances from v34 to v35. Its migration status now states the observed implementation truth:

- Ordinary invocation uses the upstream integrated-response composition interface.
- `ControllerDataflowAst` retains the integrated response and the exact source knowledge value.
- The legacy analysis view is projected exhaustively from the validated publication receipt or typed rejection.
- Static invocation remains explicitly uncovered because its algebra, authority, and coverage publication are not complete.

This replaces a stale gate that implied integrated composition was waiting to be wired even though `controllerDataflowAnalyzer.ts` already calls `integrate`.

## Six-subscanner trace

| Subscanner | Existing upstream interface | Trace finding |
|---|---|---|
| Route | `LaravelRouteScannerInterface` | Contract injects route binding authority, but `RouteScanner` still performs local method/path/action decisions. |
| Controller | `LaravelControllerScannerInterface` | Invocation composition is wired at controller dataflow analysis; the controller facade itself does not implement the declared scanner interface. |
| Model | `LaravelModelScannerInterface` | Interface exists, but the production facade is still called directly and does not implement it. |
| FormRequest | `LaravelFormRequestScannerInterface` | Interface exists, but the production facade is still called directly and does not implement it. |
| Resource | `LaravelResourceScannerInterface` | Contract takes canonical definitions and relation evidence, while implementation still performs local resolution/propagation. |
| Channel | `LaravelChannelScannerInterface` | Implementation still classifies channel kind locally. |

The source AST pipeline still calls concrete scanner facades such as `ModelScanner.scanCanonicalBundle` and `RouteScanner.scanCanonicalBundle`. Therefore the six interfaces are not yet production adoption boundaries. The audit reports this as an open gap rather than claiming interface-first migration is complete.

## Next interface-first work

1. Define closed upstream judgments for the decisions still owned by RouteScanner, ResourceScanner, and ChannelScanner.
2. Align Model and FormRequest outputs with source evidence and typed semantic judgments, preserving AST/evidence correlation.
3. Evolve the existing scanner interfaces to express those complete judgments; do not add parallel wrappers.
4. Only after interface contracts are complete, migrate the source AST pipeline to depend on those interfaces and reduce concrete scanners to evidence acquisition/delegation.
5. Add behavioral tests for ordinary invocation validation/rejection and static invocation's explicit uncovered status.

## Verification boundary

The Phase 1747 audit is a static contract/source-trace audit. It is not a TypeScript project typecheck, runtime behavior test, or package build. No build was run.
