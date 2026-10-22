# Host-owned upstream semantic composition (template)

This directory documents the runtime export contract consumed by `packages/cli/src/standaloneCompositionLoader.ts`.

1. Implement the six capabilities imported by `host-composition.template.ts` in a host-owned module. Every capability must bind to the exact same `requestTypeDerivationContract` object and implement its interface semantics, not just its shape.
2. Keep the named export exactly `requestTypeDerivationSemanticComposition` and annotate it as `RequestTypeDerivationSemanticPipelineCompositionInterface`.
3. Compile the template and its host capability module to JavaScript using the host's normal build. Point `ROUTESYNC_UPSTREAM_COMPOSITION_MODULE` at the emitted `.js` file (absolute path or path relative to the CLI process working directory), or at a resolvable package export specifier such as `routesync/upstream` (the public subpath declared by the root package's `exports` map). The package-specifier path loads the real named export directly; it does not use an examples-only shim.
4. Run `routesync scan` or `routesync sync`. The CLI loader validates executable preparation, reasoning, verifier, decision, authority rule coverage, integrity and contract equivalence before commands are exposed.
5. A successful shape check is not a semantic proof. The host must independently test source identity, AST/ADT evidence, inventory closure, semantic judgment, decision proof, source-bound authority and integrity. A capability that throws a producer-gap error is not production-complete.

The import `./productionCapabilities.js` is deliberately a host implementation seam, not a file supplied by this repository. This template must not be mistaken for a runnable implementation. The in-repository diagnostic composition is fail-closed at decision, authority and integrity and must not be represented as production-ready.
