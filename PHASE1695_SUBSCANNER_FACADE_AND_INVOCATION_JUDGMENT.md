# Phase 1695 — Subscanner Facade Boundary and Invocation Judgment Pipeline

## Trace result

The `subscanners/` directory is not currently a facade layer. The six domain entry classes (`RouteScanner`, `ControllerScanner`, `ModelScanner`, `FormRequestScanner`, `ResourceScanner`, `ChannelScanner`) still contain source traversal, classification, joins, and domain decisions. Moving imports behind a barrel or renaming the directory would not make those implementations facades.

The pipeline wiring also imports those classes directly. In addition, `controllerDataflowAnalyzer` previously called the lower-level `invocationSemanticRuntimeExecutor` directly even though a high-level `InvocationSemanticPipelineInterface` and contract already existed.

## Implemented in this phase

- Added `types/upstream/invocationSemanticPipeline.ts` as the implementation of the existing high-level pipeline contract.
- The pipeline exposes `analyzeInvocation`, ordered `analyzeBatch`, and whole-knowledge `analyzeKnowledge` operations.
- All invocation judgment work is delegated to the upstream runtime executor; this module does not derive targets, argument binding, effects, obligations, proof traces, or closure.
- `controllerDataflowAnalyzer` now consumes `invocationSemanticPipeline.analyzeKnowledge(...)` instead of the lower-level runtime executor.
- Exported the pipeline through the upstream barrel and core public entry point.

## Subscanner migration/removal gate

Do not delete `subscanners/` wholesale yet. Several producers and AST canonicalizers are imported directly by binders, resolvers, semantic evidence adapters, tests, and pipeline wiring. Deleting them before moving their behavior behind stable contracts would break the source model and merely hide semantic reasoning elsewhere.

Required order for each domain scanner:

1. Define a domain-specific upstream input/output contract and closed judgment where the domain makes semantic decisions.
2. Move semantic rules into the upstream algebra/authority and validate source evidence, identity, obligations, and closure.
3. Introduce an interface-backed facade that only gathers source evidence and delegates; no reclassification or semantic fallback.
4. Migrate every production and test import to the facade/producer contract; audit transitive imports.
5. Empty legacy class files in-place only after they have no production consumers, then remove them in a separately verified cleanup phase.

Priority order: invocation/controller action semantics, route target and route-model binding, request derivation, model relation semantics, resource binding, then channel and remaining evidence producers.

## External design references

- Laravel routing documentation distinguishes route declarations, controller targets, and route-model binding behavior. Route model binding has implicit, explicit, custom-key, and scoped variants; scanner inference must preserve those distinctions rather than flatten them into a naming heuristic.
- TypeScript Compiler API documentation distinguishes parsing/AST, binding, semantic checking, and emission. RouteSync should likewise keep source evidence collection separate from semantic judgment and downstream projection.

## Verification status

Static boundary checks are suitable for this phase. A full build must be run in an environment with the repository's declared `tsdown` tool installed. Do not interpret a missing executable as a passing build.
