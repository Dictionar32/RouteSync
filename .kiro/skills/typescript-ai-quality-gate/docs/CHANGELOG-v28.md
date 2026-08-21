# v28 hardening
- Independent `failures[]` recomputation.
- VERIFIED source digest must be present and non-self-referential; parent digest is checked when supplied.
- Schema/version aligned to 28.0.0 and finding summary includes advisory.
- Release package strips Python bytecode caches.

## v28.1 audit remediation
- synchronized release root to `quality-gate-v28/` and aligned SKILL, policy, schema, parser lineage, status, packaging, and self-tests to 28.0.0;
- corrected attestation lifecycle schema so `quality-run` may emit `UNVERIFIED` and only `quality-verify` may emit a separate `PASS`/`VERIFIED` artifact with `verified_attestation_of`;
- independently recomputed `failures[]` before deriving `failure_types[]`;
- made required adapter/tool unavailability explicit execution evidence;
- tightened adapter command/capability, baseline lineage, semantic-change, provenance, and verification schemas;
- renamed the semantic self-test to v28 and expanded the package self-test to cover verification lifecycle and failure tampering;
- kept compiler/AST-backed intelligence features explicitly out of the verified capability contract until implemented.

## v28.3 audit remediation
- parent repository identity is compared only to `baseline_lineage.repo_identity`; current child identity may legitimately differ after source changes;
- schema validation is mandatory and falls back to the bundled v28 schema when no schema path is supplied;
- VERIFIED attestations require the actual source attestation, verify its digest and intrinsic integrity, and require that source to be a PASS/UNVERIFIED attestation bound to the live repository;
- baselines are independently validated for digest, schema, policy, execution chain, semantic summary, failures, decision, trust, risk, complexity delta, and PASS state before their data is trusted;
- parser diagnostics are normalized even when a tool exits with code 0;
- adapter contracts explicitly distinguish native/generic/none parser implementations;
- audit self-tests cover forged VERIFIED sources, missing source attestations, bundled-schema fallback, malformed baselines, parent/current identity changes, and exit-0 diagnostics.


## v28.4 audit-complete remediation

- replaced generic diagnostic parsing with native JSON parsers for Biome, ESLint, ShellCheck, Cargo/rustc, PHPStan, and PHPCS where machine-readable output is available;
- added TypeScript compiler-API and Python AST structural analysis for reuse and per-function complexity;
- added tsconfig path, relative, node_modules package, and package-exports aware dependency resolution;
- added language-aware public API index and baseline/current API diff to semantic-change analysis;
- changed Rust/Cargo and shell adapter commands to request machine-readable diagnostics;
- strengthened adapter contracts to record native versus structured fallback parser implementations;
- upgraded schema, policy, skill, and engine version contract to 28.4.0.

## Post-audit remediation patch

The follow-up audit findings are now addressed in the implementation:

- TypeScript Compiler API resolution now prefers the target repository/workspace and supports global fallback; AST results are repository-relative so reuse and complexity actually consume the compiler backend.
- TypeScript function complexity includes control-flow nesting rather than raw AST depth.
- TypeScript public API indexing records parameter/return signatures for compatibility-sensitive changes.
- Node package resolution now handles workspace packages and recursive conditional/subpath `exports` with `types`/`import`/`require`/`default` preference.
- PHP/Laravel architecture analysis now includes Composer PSR-4 and namespace/use dependency edges.
- Semantic change analysis now records a dependency reverse/affected graph for changed files.
- Intrinsic attestation verification treats affected-graph data correctly when the live repository is unavailable while keeping all hash-derived semantic fields strict.
- The attestation schema was extended for the affected-graph contract.

The complete v28.4 audit self-test suite passes after these changes.


## 28.4 TypeScript Quality Evidence
- Added deterministic TS/TSX quality analysis as a first-class analysis evidence item.
- Added policy-controlled minimum quality score (default 85).
- Added independent verifier recomputation of TypeScript quality evidence.
- AI/generated-code signals are advisory only; objective high/critical findings remain blocking.
- Added adversarial semantic self-tests for TypeScript quality findings and scoring.

### v28.4 TSQ hardening
- Added an independent TypeScript quality verification path (`engine/verifier_tsq.py`) for invariant source metrics.
- Verifier now recomputes execution-gate invariants and rejects forged TSQ metrics even when the outer attestation digest is recomputed.
- TSQ quality score is now a weighted quality indicator; blocking findings remain policy-controlled and are not bypassed by score.
- Duplicate type/interface detection compares normalized declaration shape instead of name alone, reducing false positives from legitimate declaration merging.
- Unused-import detection remains explicitly conservative and lexical; semantic TypeScript rules continue to use compiler-backed analysis where available.
- Release self-test launcher is executable (`0755`).

### Final audit remediation
- Removed global `npm root -g` discovery from the TypeScript analyzer; compiler resolution is bounded to local/ancestor `node_modules`, `require.resolve`, and `NODE_PATH`.
- Bounded TypeScript compiler execution to 15 seconds and fail-safe to deterministic source analysis when the compiler is unavailable.
- Added TSQ rules for excessive parameters, unreachable-after-return/throw code, exported naming anomalies, suspicious dependencies/install hooks, and explicit compiler-backend status.
- TSQ evidence status is now blocking when the analyzer reports high/critical findings; score remains a quality indicator rather than the sole decision boundary.
- TSQ score threshold is read from attested policy rather than hard-coded in the analyzer report.
- Release scripts are packaged executable (0755).
- Extended semantic self-tests for new TSQ rules and bounded compiler resolution.


## Final15 remediation
- TypeScript compiler/runtime unavailability is now fail-closed with blocking capability evidence.
- TypeScript analysis now records semantic diagnostics and compiler-backed module resolution/import evidence.
- Duplicate token and unreachable-code heuristics are explicitly advisory and non-blocking.
- Release packaging excludes Python bytecode/cache artifacts.
- SKILL.md now requires semantic-first TypeScript analysis and clean release hygiene.


## Final16 semantic-contract remediation
- TypeScript Compiler API evidence now explicitly records `semantic_available`, per-file semantic diagnostics, imports, resolved imports, and unresolved relative imports.
- Semantic diagnostics are surfaced as blocking TSQ-032 findings with diagnostic code and message.
- Semantic evidence metrics are included in attested TSQ metrics.
- The independent verifier now performs a fresh TypeScript semantic verification pass and compares semantic diagnostic/module-resolution invariants against attested evidence.
- The semantic self-test execution is bounded to 90 seconds with forced process-group cleanup.
- Final16 validation includes a real TypeScript semantic-error fixture proving compiler diagnostics become blocking findings.

## Final19 audit remediation
- Security severity is now evidence/context driven: dangerous sinks alone are low/advisory, dynamic construction is higher risk, and clear untrusted-input flow can become high/critical.
- `Object.assign` prototype-pollution signals now distinguish untrusted merges from concrete dangerous-key evidence; no concrete flow is claimed without contextual evidence.
- TypeScript unused-import detection now prefers TypeChecker/reference analysis; lexical fallback is explicitly diagnostic-only and non-blocking.
- Project model source/test roots no longer treat monorepo container directories such as `packages/` as roots unless they are actual code-bearing roots; workspace globs are expanded to package directories when possible.
- `pnpm-workspace.yaml` parsing now handles the common `packages:` block and inline list forms while stripping comments and retaining an explicit workspace contract.
- Independent TypeScript verification now compares semantic diagnostics, resolved imports, unresolved relative imports, unused-import counts, and exported-symbol counts.
- Structural duplicate-type detection now requires meaningful multi-member structural similarity and is advisory/non-blocking.
- AI-code signals now cover additional thin factories, generic config/props abstractions, and repeated generic error-handling wrappers while remaining advisory.
- Added semantic/security/project-model regression tests for the Final19 contract.

## Final20
- Added conservative same-file local data-flow tracking for security sinks, including assignment aliases and balanced multiline calls.
- Security severity now distinguishes sink-only, dynamic construction, untrusted flow, and dangerous-key + untrusted-flow evidence.
- Added independent security invariant recomputation for attestation verification.
- Workspace discovery now applies pnpm-style negative workspace patterns and exposes resolved workspace directories.
- Added package-manager evidence classification (`declared`, `lockfile`, `not_detected`).
- Removed TypeChecker symbol name/flags fallback; symbol identity is authoritative.
- Added regression coverage for multiline security flows and workspace exclusions.

## v28.4 Final21
- Added bounded same-file/interprocedural security data-flow propagation.
- Added destructuring source propagation and request-parameter sink summaries.
- Added arrow-function and named-function parameter flow coverage.
- Added adversarial regression tests for destructuring, alias chains, parameter propagation, cross-function flow, and constant-safe calls.
- Kept uncertain flows non-blocking and bounded; this is not a full taint engine.
- Extended independent security invariant verification for bounded function propagation.

## v28.4 Final23
- Extended bounded same-file/interprocedural security flow to multi-hop wrapper summaries (up to four propagation rounds).
- Added nested destructuring propagation for request/context bindings while excluding property-key identifiers where possible.
- Prevented function declarations and arrow-function declarations from being misinterpreted as call sites during propagation.
- Added adversarial regression coverage for three-function wrapper chains and nested destructuring.
- Updated the security contract to explicitly describe bounded wrapper propagation and uncertainty beyond the bound.

## v28.4 Final25

- Added bounded object-spread/property propagation for contextual security analysis.
- Added class-method and method-summary coverage to bounded function propagation.
- Added adversarial regression coverage for object spread, class methods, default parameters, and re-export/import aliases.
- Preserved advisory treatment for uncertain flows and bounded analysis semantics.
- Final26: extended bounded security data-flow to destructured function parameters and class methods, including inherited-method call patterns; added adversarial regression coverage.

## v28.4 Final27 adversarial-flow remediation
- added bounded array/tuple taint carriers and constant computed-property reads;
- added top-level argument splitting so nested arrays/objects do not corrupt parameter propagation;
- added adversarial coverage for computed properties, object copies/spreads, arrays, nested callbacks, defaults, and cross-file re-export aliases;
- preserved bounded evidence semantics: unresolved dynamic property/index flows remain uncertain rather than being treated as safe or proven vulnerable.

## v28.4 Final28
- Added bounded property-mutation taint propagation for simple member assignments.
- Preserved uncertainty for dynamic computed writes.
- Extended self-test watchdog ceilings to avoid false timeout failures on slower environments while remaining bounded.

## v28.4 Final29 self-test reliability remediation
- Removed the `exec env ... timeout ... "$0"` watchdog pattern from the bundled audit runner; the watchdog now launches a fresh Bash process and explicitly returns the child exit status.
- Added configurable bounded watchdog ceilings (`V28_SELFTEST_TIMEOUT`, `V28_SEMANTIC_TIMEOUT`, and `V28_RUNX_TIMEOUT`) with conservative defaults.
- Kept timeout failures fail-closed and observable as non-zero exits.
- Added the same explicit watchdog/exit-status behavior to the independent `runx.sh` verification runner.

## v28.4 Final30 return-flow hardening
- Added bounded function return-parameter summaries so taint can propagate through `get(req.body.x) -> return x -> exec(result)` patterns.
- Kept return propagation bounded to four rounds and direct parameter-dependent return expressions; unknown return flows remain uncertain.
- Removed the remaining TypeChecker unused-import symbol-name/flags fallback; reference matching now relies exclusively on compiler symbol identity.
- Added adversarial regression coverage for tainted return values and a guard against reintroducing lexical symbol identity fallbacks.
- Extended the release contract to treat return-value propagation as contextual evidence, not full-program taint analysis.

## Final31
- Extended bounded return-value propagation to `await` call assignments and added async/method-return adversarial coverage.

## Final32
- Added bounded Promise `.then(...)` callback propagation for concrete untrusted-to-sink flows.
- Added bounded async/object-return propagation for assigned object properties.
- Added independent verifier invariants for the new Promise callback and object-return flow evidence.
- Added adversarial semantic self-tests for Promise callback and object-return propagation.


## Final34
- Tightened function-parameter security evidence: declaration-time findings now require an explicit request/input property path to the sink.
- Removed generic call-site taint fallback for request-like parameter names in the independent verifier.
- Prevents unrelated safe Promise/callback sinks from inheriting taint merely because the containing function accepts `req`/`request`/`ctx`.

## Final35 Promise/class-flow hardening
- Added bounded `Promise.resolve(...).then(...).then(...)` propagation with explicit callback-stage evidence.
- Added bounded rejected-Promise `.catch(...)` propagation; `finally(...)` does not inherit settled-value taint through a callback parameter.
- Added independent TSQ recomputation for the new Promise chain invariant.
- Fixed cross-file exported class-method evidence so `new ImportedClass().method(untrusted)` can produce concrete `cross-file-class-method` evidence.
- Cached exported class-method summaries by repository/file stamp to avoid repeated whole-project rescans during per-file analysis.
- Hardened the bundled `run.sh`/`runx.sh` semantic invocation so the outer watchdog owns the execution bound and child exit status remains observable.
- Added adversarial regression coverage for Promise chains, rejected Promise values, `finally`, unrelated safe callbacks, and cross-file class methods.

## Final37 reliability hardening
- `runx.sh` now uses explicit per-stage watchdogs with `RUNX_STAGE_START/PASS/FAIL` markers.
- Child stage failures and timeouts are propagated instead of being hidden by a later PASS marker.
- The semantic suite has its own configurable ceiling via `V28_RUNX_SEMANTIC_TIMEOUT`.
- `V28_RUNX_STAGE_TIMEOUT` bounds individual quality-run/verify stages.
- The wrapper remains fail-closed: a timeout returns non-zero and cannot be reported as a successful suite.

## Final40
- Fixed `runx.sh` fail-closed stage handling under `set -e`: child non-zero/timeout status is now captured and propagated explicitly.
- Added a distinct semantic-suite timeout override (`V28_RUNX_SEMANTIC_TIMEOUT`) without weakening failure semantics.
- Fixed self-test failure reporting when subprocess output is redirected to `DEVNULL`.


## Final40
- Extended default self-test/watchdog ceilings to reduce false timeout failures on slower environments.
- Preserved fail-closed semantics: timeout/non-zero remains failure and never becomes PASS.
- Stage timeout and semantic timeout remain independently configurable via environment variables.


## Final40
- Stabilization-only release: added a bounded `stabilization_gate.py` and `stabilization.sh`.
- Added consolidated adversarial regression coverage for unrelated request parameters, Promise chains, direct request-property sinks, and cross-file class methods.
- Added explicit static Python/Bash hygiene checks.
- Preserved fail-closed timeout semantics; timeout and analyzer unavailability can never be promoted to PASS.
- Full release certification still requires both primary and alternate runners to exit 0 in the target runtime.

## Final41 independent certification audit

Final41 performs an external/raw-output certification audit rather than trusting the analyzer's attestation. The audit found a blocking false-positive security flow (FP-41-001): an unrelated request parameter can contaminate a later constant Promise/process-execution sink in the same file. Final41 is therefore **BLOCKED / NOT A RELEASE CANDIDATE** pending data-flow scoping remediation and rerun of independent certification.

## Final42
- Remediated FP-41-001: TypeScript declarations/signatures are no longer parsed as runtime security sink calls.
- Preserved function-scoped evidence isolation and the Final41 negative regression gate.
- No new security capability added; this is a certification remediation/release freeze change.
