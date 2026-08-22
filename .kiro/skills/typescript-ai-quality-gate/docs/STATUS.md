# v28 status

v28 is the verification-kernel hardening release, with the v28.4 full intelligence remediation package contract.

Implemented:
- synchronized skill/engine/schema/policy version contract at 28.4.0;
- immutable attested resolved-policy bundle and policy-source digests;
- independent evidence, failure, failure-type, finding-summary, risk, decision, and trust recomputation;
- explicit UNVERIFIED -> VERIFIED lifecycle with source-attestation lineage;
- explicit unavailable required adapter/tool evidence;
- strict release-root and self-test version lineage;
- strict nested schema for adapter commands, adapter capabilities, provenance, baseline lineage, semantic-change metadata, and parser implementation kind;
- mandatory bundled-schema fallback;
- independently validated PASS baselines;
- VERIFIED source-attestation anchoring;
- parent/current repository identity semantics that allow legitimate source changes;
- diagnostics preserved when tools exit successfully.

Known intelligence-layer scope:
- native Biome/ESLint/Rust/PHPStan/PHPCS/ShellCheck parsers use machine-readable contracts where guaranteed; generic/structured fallback remains explicit for tools without a guaranteed machine format;
- reuse uses Python AST / TypeScript compiler AST with syntax-token fallback for other languages;
- TypeScript resolution models tsconfig paths, workspace packages, and authoritative conditional/subpath exports; project references and full Node condition matrices remain out of scope;
- Laravel architecture is not yet a full PSR-4/controller/service/repository/policy/middleware/request graph;
- complexity is recomputed per function where language ASTs are available, with AST-derived Python/TypeScript nesting and token-aware fallback for other languages;
- semantic change includes language-aware public API/symbol diff plus security/dependency/configuration classification;
- affected-graph analysis is available as a dependency reverse graph; fully incremental persistent caching across separate runs is not yet implemented.

These boundaries are intentional and are not treated as VERIFIED intelligence capabilities.

### Follow-up audit remediation

The post-v28.4 audit remediation includes target-repository TypeScript compiler resolution, relative AST indexing, TS control-flow nesting, public API signatures, Node conditional exports/workspaces, Composer PSR-4 PHP dependency edges, and dependency affected-graph analysis. The bundled audit suite passes after these changes.

### v28.4 follow-up audit remediation

The follow-up audit fixes native PHPStan/PHPCS machine-readable invocation, shared TypeScript AST caching, authoritative conditional exports, workspace YAML variants, modern ESLint config discovery, AST-derived Python nesting, and type-aware public API signatures for Python/PHP/Rust/TypeScript.

### v28.4 audit hardening (post-final5)

- centralized attested-policy reconstruction in the verifier so embedded resolved policy is the sole input to intrinsic risk/decision recomputation;
- live repository policy is explicitly limited to drift/conflict detection;
- added adversarial self-tests for live policy drift and policy-source tampering;
- restored repository fixture state between lineage and policy-boundary tests to prevent test-order contamination.


## TypeScript Quality Gate

v28.4 now includes a deterministic TypeScript/TSX quality evidence layer. It analyzes file/function size, compiler-derived complexity and nesting, `any`, TypeScript suppressions, console logging, TODO/FIXME markers, unused named imports, async/error-handling anti-patterns, duplicate type/interface names, repetitive token blocks, and advisory generated-code comment patterns. The analyzer produces normalized evidence and AI repair feedback; it does not decide trust independently. The v28.4 verifier recomputes the TS quality report and compares it byte-for-byte as canonical JSON before accepting verification. The default policy enables a minimum score of 85, while high/critical findings remain blocking regardless of score.

## Final audit remediation status

The TypeScript Quality Gate is an evidence-producing analysis layer, not a decision authority. The v28.4 policy/attestation verifier remains authoritative for PASS/BLOCKED/VERIFIED state.

TypeScript compiler discovery is bounded and does not invoke the package manager. If the compiler is unavailable, the analyzer records an explicit deterministic fallback backend; no unbounded external discovery is performed.

High/critical TSQ findings are represented as failed analysis evidence and therefore fail closed. The numeric TSQ score is informational/threshold-based and cannot override a blocking finding.


### Final16 status
Final16 closes the post-Final15 semantic contract gap: compiler-backed semantic diagnostics and module-resolution evidence are retained in TSQ evidence, independently rechecked by the verifier, and analyzer execution is bounded. A semantic-error fixture confirms that TypeScript compiler diagnostics produce blocking findings rather than a clean result.

### Final29 self-test reliability
The bundled audit runner uses an explicit child-process watchdog rather than `exec`-replacing itself with `timeout`. Timeout and child failure statuses are returned unchanged, preventing a completed PASS-marker stream from being mistaken for a successful suite when the wrapper itself was terminated. The semantic and independent runners retain bounded, configurable ceilings.

### Final30 return-flow hardening
Final30 closes the bounded return-value propagation gap identified after Final29. Function summaries now record parameters that influence direct return expressions, allowing taint to propagate through common local return wrappers before reaching a security sink. TypeChecker import reference matching is symbol-identity-only. These remain bounded evidence capabilities and are not presented as a full taint engine.

## Final31
- Extended bounded return-value propagation to `await` call assignments and added async/method-return adversarial coverage.

### Final34 async/Promise return-flow hardening
Final34 extends the bounded TypeScript security evidence layer with concrete Promise `.then(...)` callback propagation and one-hop async/object-return property propagation. These capabilities are deliberately bounded and evidence-based; dynamic Promise chains, arbitrary higher-order flow, and unresolved computed properties remain uncertain rather than being declared safe. The independent TSQ verifier recomputes the corresponding invariant counts.

## Final34
Security parameter evidence was tightened so request-like parameters do not taint unrelated sinks. Direct request-property-to-sink flows remain blocking, while unrelated Promise/callback sinks remain non-blocking.

### Final35 status
Final35 extends the bounded TypeScript security evidence layer to explicit Promise resolve/reject chains and fixes cross-file class-method propagation. Promise `finally` callbacks do not inherit settled-value taint. Exported class-method summaries are cached by repository file stamp to avoid quadratic rescanning. These remain bounded contextual evidence capabilities, not full-program taint analysis.

### Final37 wrapper reliability
Final37 hardens the alternate `runx.sh` harness with independently bounded stages and explicit timeout/failure markers. A semantic-suite timeout is now observable as a non-zero stage failure rather than an apparently hanging wrapper. This release does not convert a timed-out suite into PASS; verification remains fail-closed.


### Final42 release note
Final42 increases default watchdog ceilings for slower CI/runtime environments while preserving explicit non-zero timeout failure semantics. Full-suite completion must still be verified in the target runtime; timeout is never treated as PASS.


### Final42 stabilization gate
Final42 is a stabilization release rather than a new intelligence-layer feature release. It adds a bounded stabilization harness covering Python/Bash static hygiene and a consolidated adversarial TypeScript security fixture. The fixture specifically guards against generic request-parameter taint, while preserving direct request-property, multi-hop Promise, and cross-file class-method evidence. The gate is fail-closed: timeout or analyzer unavailability is non-zero and cannot become PASS. Full release certification additionally requires both `run.sh` and `runx.sh` to exit 0 in the target runtime.

## RouteSync Extensions (v28.5)

v28.5 adds RouteSync-specific extensions for monorepo workspace validation, export path verification, and framework-specific pattern checks. These extensions are enabled via `routesync.config.json` and integrate into the existing analysis and verification pipeline.

### Implemented Features

✅ **Workspace Dependency Validation** (`engine/workspace.py`)
- Monorepo workspace package detection
- Circular dependency detection between workspace packages
- Dependency direction validation (core → domain → app)
- Package.json workspace configuration parsing

✅ **Export Path Validation** (`engine/exports.py`)
- package.json exports field validation
- Conditional exports verification
- Missing export file detection
- TypeScript declaration file checks

✅ **Framework Pattern Validation** (`engine/frameworks.py`)
- React Hooks rules validation (no conditional hooks)
- Vue Composition API reactivity checks (toRefs usage)
- TanStack Query patterns (optional)

✅ **Configuration Integration** (`engine/config.py`)
- routesync.config.json loading and parsing
- Threshold configuration (critical, high, medium)
- Framework-specific rule enablement
- Policy integration

✅ **Analysis Pipeline Integration** (`engine/analysis.py`)
- routesync_extensions() function implementation
- Config-driven analysis execution
- Threshold violation detection
- Evidence normalization

✅ **Verification Integration** (`engine/verifier.py`)
- RouteSync extensions recomputation in verify()
- Workspace analysis consistency checks
- Export validation consistency checks
- Independent verification of extension findings

✅ **Schema Updates** (`schemas/attestation.schema.json`)
- workspace_analysis object schema
- export_validation object schema
- framework_validation results schema

✅ **Policy Rules** (`policies/default.json`)
- circular-workspace-dependency
- invalid-workspace-dependency-direction
- missing-export-path
- hooks-called-conditionally
- reactive-destructure-without-torefs
- missing-cli-shebang
- bundle-size-exceeded
- missing-peer-dependency

✅ **Test Coverage** (`self-tests/test_routesync_extensions.py`)
- Workspace validation tests
- Export validation tests
- Framework pattern tests
- Config integration tests
- Full pipeline integration tests
- Schema compliance tests

### Known Limitations

⚠️ **CLI Validation** - Not yet implemented
- Shebang validation for CLI entry files
- Execute permission checks
- Cross-platform path validation

⚠️ **Bundle Size Enforcement** - Not yet implemented
- Integration with size-limit or similar tools
- Budget enforcement per chunk/entry
- Bundle analysis integration

⚠️ **TSDoc Coverage** - Not yet implemented
- Documentation coverage metrics
- Missing @param/@returns detection
- Public API documentation requirements

⚠️ **npm audit Integration** - Not yet implemented
- Vulnerability scanning with blocking CVE thresholds
- Peer dependency validation
- Automated security advisory checks

### Architecture Notes

The RouteSync extensions follow the v28.4 evidence-based analysis model:
- Extensions produce normalized evidence, not trust decisions
- The verifier independently recomputes all extension findings
- Threshold violations are advisory unless marked blocking
- All extensions are bounded and deterministic
- Config files are loaded once and validated against schema

Extension findings are included in the attestation under:
```json
{
  "workspace_analysis": {
    "violations": [...],
    "dependencies": [...],
    "workspaces": [...]
  },
  "export_validation": {
    "violations": [...],
    "exports": {...}
  },
  "framework_validation": {
    "react": [...],
    "vue": [...]
  }
}
```

The verifier recomputes these sections independently and compares byte-for-byte as canonical JSON before accepting verification.
