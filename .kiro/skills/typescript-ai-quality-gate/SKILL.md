# TypeScript Implementation Quality Gate

## Agent contract

You are a TypeScript Implementation Quality Engineer. Your purpose is to prevent low-quality, fragile, unsafe, or architecturally inconsistent TypeScript implementations from being accepted. You are **not** an AI-authorship detector.

### Mandatory workflow
1. Discover the project structure; do not assume a standard layout.
2. Build the module/dependency model and identify boundaries and entry points.
3. Prefer TypeScript Compiler API, AST, and TypeChecker for semantic claims.
4. Perform file-level and cross-file quality analysis.
5. Perform bounded, evidence-based security data-flow analysis.
6. Treat AI-code signals as advisory only; never block solely on them.
7. Produce findings with rule, severity, confidence, location, evidence, impact, and remediation.
8. Remediate blocking/high findings minimally and re-analyze.
9. Independently verify raw analyzer output; never treat analyzer attestation as truth.
10. Fail closed when required evidence or semantic analysis is unavailable.

### Security evidence contract
Use these conceptual states: **PROVEN_UNSAFE**, **UNCERTAIN**, and **NO_CONCRETE_FLOW**. A blocking security finding requires a concrete source → propagation → sink path. Do not infer taint merely because a parameter is named `req`, `request`, or `context`, or because a source and sink occur in the same function/file. `finally()` callback parameters do not receive Promise settlement values.

### Decision contract
Return exactly one of: `PASS`, `PASS_WITH_WARNINGS`, `BLOCKED`, `ANALYZER_UNAVAILABLE`. Never claim a test/tool passed unless it actually ran. A timeout, compiler/analyzer failure, or unavailable required semantic check cannot become PASS.

### Runner contract
`self-tests/run.sh` is a bundled regression/stabilization runner; it is not by itself an independent certification. `self-tests/runx.sh` provides the alternate verification path. Independent certification must read raw output and recompute findings/evidence.

### Installation
Install this directory as `.kiro/skills/typescript-ai-quality-gate/`. Keep `SKILL.md` as the skill entry point. Do not copy generated benchmark directories, temporary fixtures, Python bytecode, or runtime attestations into a project.

---


Cross-project post-implementation quality gate for agents working on TypeScript, Rust, Bash, PHP/Laravel and mixed repositories.

After implementation, and after every remediation iteration, the agent must inspect project-local conventions, derive project-native validation commands, execute applicable checks with argv/no shell, validate formatter/linter/type/build/test contracts where available, review reuse/architecture/complexity, record evidence, re-snapshot, attest, and invoke the independent verifier.

Version contract:
- skill_version: 29.0.0-routesync
- engine_version: 28.4.0
- schema_version: 28.4.0
- policy_version: 28.4.0
- routesync_extensions: 1.0.0

The attestation records a resolved policy bundle and its source digests. Verification uses the attested resolved policy for risk recomputation and separately detects current policy drift. Baseline lineage is verified when a parent attestation is supplied to the verifier.

PASS means required evidence and independent recomputation succeed and the final repository snapshot matches the attested snapshot. BLOCKED means required proof is absent or cannot be independently verified. An analyzer error is never treated as a clean finding; compiler/tool execution failures in the intelligence layer produce blocking evidence and require remediation or an explicit unavailable-capability result.

A successful independent verification may emit a separate VERIFIED attestation artifact; the original run attestation remains immutable.


Verification lifecycle:
- quality-run emits an immutable UNVERIFIED attestation.
- quality-verify independently recomputes integrity, evidence, findings, failures, risk, decision, and trust.
- a separate VERIFIED artifact is emitted only after independent verification succeeds; it must reference the source attestation digest.

Implemented intelligence-layer scope: native machine-readable tool parsers, compiler/AST-backed TypeScript semantic diagnostics and complexity, tsconfig/package-aware TypeScript module resolution/import graph evidence, language-aware API diff, and structural affected-graph analysis. TypeScript semantic analysis is fail-closed: when the compiler API/runtime is unavailable, the run emits blocking unavailable-capability evidence; lexical fallbacks are diagnostic-only and cannot establish PASS. Incremental caching remains an optimization rather than a correctness dependency.


### TypeScript AI Quality Gate
For TypeScript/TSX repositories, the quality run emits `typescript-quality-analysis` evidence. The analyzer is a deterministic quality/maintainability engine, not an AI-authorship classifier. It reports per-file semantic compiler diagnostics, structural complexity, oversized files/functions, unsafe TypeScript suppressions, excessive `any`, console/TODO residue, import/module resolution evidence, async/promise anti-patterns, duplicate types, repetitive blocks, and advisory generated-code patterns. Cross-file dependency evidence is used where available. Heuristic duplicate/dead-code signals are advisory and must not masquerade as semantic proof. Unused imports use TypeChecker/reference evidence when the compiler backend is available; lexical fallback is diagnostic-only. Structural duplicate-type similarity is advisory. The verifier independently recomputes semantic invariants including diagnostics, module resolution, unused-import counts, and exported-symbol counts. A compiler/API failure is a blocking capability failure, not a clean result. The policy default minimum score is 85; score is never a substitute for blocking findings.


Self-test reliability: the bundled audit runner is bounded to 120 seconds by its watchdog when the `timeout` utility is available; the semantic suite itself is bounded to 90 seconds. Timeout and child failures are propagated as non-zero results and are treated as failure.


Agent remediation loop:
- Generate or modify code.
- Run the applicable quality gate.
- If findings are present, remediate the implementation rather than merely suppressing findings.
- Re-run the gate after remediation and compare the new evidence/snapshot.
- Stop only when the required checks PASS or the gate returns BLOCKED with an explicit, auditable reason.
- Do not claim AI-authorship detection; generated-code signals are advisory maintainability evidence.

Release hygiene:
- Distribution archives must exclude `__pycache__/`, `*.pyc`, temporary attestations, local environment files, and other runtime artifacts.
- Semantic TypeScript analysis must be preferred over regex/lexical heuristics for correctness-sensitive findings.

### Project model, scope, and security contract
The quality gate must create a structured project model before judging implementation quality. The model records package manager/lockfiles, package scripts, dependency inventory, TypeScript configurations and project references, workspace information, source/test roots, build/lint/test/format/framework configuration hints, TypeScript file inventory, and Git working-tree scope when Git is available. Changed files and their affected dependency surface must be distinguished from pre-existing repository content.

The TypeScript quality layer also performs conservative contextual security checks for dynamic code evaluation, process execution, user-controlled filesystem paths, deserialization boundaries, and prototype-pollution-sensitive object merges. These are source-context signals with a conservative bounded same-file/interprocedural data-flow layer (assignment aliases, destructuring, function-parameter propagation, wrapper summaries, and multiline sink calls). They are not a substitute for a dedicated whole-program taint/data-flow security engine. Dangerous sinks alone remain low/advisory; dynamic construction can be high, and clear untrusted-input flow can be high/critical. Uncertain matches must remain non-blocking unless concrete unsafe flow evidence is present. Multiline calls, aliases, destructuring, and bounded same-file wrapper chains must be tracked so obvious flows such as `const cmd = req.body.command; exec(cmd)` and `run(req.body.command) -> exec(command)` are not missed. Cross-function propagation is bounded; flows beyond the bound remain uncertain rather than being treated as safe. A security signal must be contextual; a variable name alone is not evidence. Security findings are independent of AI-generated-code signals.

Generated-code/AI signals include unnecessary wrappers, repetitive defensive boilerplate, placeholder/generative markers, and similar maintainability patterns. These remain advisory and cannot independently produce BLOCKED.

The project model is included in the attested evidence and is independently recomputed by the verifier. Any project-model drift between attestation and verification invalidates verification.


## Final40 stabilization contract
Final40 is a stabilization gate. It does not add a new unbounded taint-analysis capability. Release verification must include static hygiene, adversarial security regression, bounded runtime behavior, and independent full-run exit status. Timeout, analyzer unavailability, or missing evidence must remain non-PASS.

---

## RouteSync-Specific Quality Extensions v1.0.0

This section extends the base TypeScript AI Quality Gate with RouteSync-specific validations for monorepo SDK generation projects.

### 1. Monorepo & Workspace Architecture Validation

#### 1.1 Workspace Dependency Graph Analysis
**Scope:** Analyze cross-package dependencies in `packages/*` workspace structure.

**Required Checks:**
- ✅ **Workspace Package Discovery:** Detect all packages defined in root `package.json` workspaces field
- ✅ **Circular Dependency Detection:** Verify no circular imports between `@routesync/core`, `@routesync/sdk`, `@routesync/react`, `@routesync/vue`, `@routesync/cli`
- ✅ **Dependency Direction Enforcement:** 
  - `core` MUST NOT depend on any other workspace package
  - `sdk` MAY depend on `core` only
  - `react` MAY depend on `core` and `sdk` only
  - `vue` MAY depend on `core` and `sdk` only
  - `cli` MAY depend on any package
- ✅ **Path Mapping Validation:** All `@routesync/*` paths in `tsconfig.json` must resolve to actual workspace directories

**Evidence Required:**
```typescript
{
  "workspace_analysis": {
    "packages_found": ["core", "sdk", "react", "vue", "cli"],
    "dependency_graph": { /* adjacency list */ },
    "circular_deps": [], // MUST be empty
    "path_mappings_valid": true,
    "dependency_violations": [] // MUST be empty
  }
}
```

**Blocking Conditions:**
- Circular dependencies detected between workspace packages
- Invalid workspace dependency direction (e.g., `core` importing from `sdk`)
- Path mappings in `tsconfig.json` don't match actual workspace structure

#### 1.2 Package Boundary Enforcement
**Scope:** Ensure packages only import through public APIs, not internal implementation details.

**Required Checks:**
- ✅ **Public API Surface:** Each workspace package MUST define clear exports in `package.json`
- ✅ **Internal Import Detection:** Flag imports like `@routesync/core/internal/*` or direct file paths
- ✅ **Barrel Export Usage:** Prefer imports from package root (e.g., `@routesync/core`) over deep imports

**Severity:** HIGH if internal imports detected across packages

---

### 2. Multi-Export Package Validation

#### 2.1 Package.json Exports Validation
**Scope:** Validate all export paths in `package.json` match actual build artifacts.

**Required Checks:**
- ✅ **Export Path Existence:** All paths in `exports` field must exist after build
  ```json
  {
    ".": "./dist/sdk.js",           // MUST exist
    "./core": "./dist/core.js",     // MUST exist
    "./react": "./dist/react.js",   // MUST exist
    "./vue": "./dist/vue.js"        // MUST exist
  }
  ```
- ✅ **Type Declaration Files:** For every `.js` export, corresponding `.d.ts` MUST exist
- ✅ **Dual Package Exports:** Verify both ESM (`.mjs`) and CJS (`.js`) exports are valid
- ✅ **Conditional Exports Integrity:**
  - `import` field points to ESM build
  - `require` field points to CJS build
  - `types` field points to `.d.ts` declaration

**Blocking Conditions:**
- Exported path doesn't exist in `dist/`
- Missing `.d.ts` files for TypeScript consumers
- ESM/CJS mismatch (importing CJS from ESM context or vice versa)

#### 2.2 Subpath Pattern Validation
**Evidence Required:**
```typescript
{
  "export_validation": {
    "exports_checked": 5,
    "missing_files": [],        // MUST be empty
    "missing_types": [],        // MUST be empty
    "dual_package_valid": true,
    "exports_match_build": true
  }
}
```

---

### 3. Build Tool Integration (Turbo + tsup)

#### 3.1 Turbo Monorepo Orchestration
**Scope:** Validate Turbo task configuration and execution.

**Required Checks:**
- ✅ **Turbo.json Validation:** Parse and validate `turbo.json` pipeline config
- ✅ **Task Dependency Graph:** Verify `build` depends on workspace package builds
- ✅ **Cache Configuration:** Check Turbo cache is properly configured
- ✅ **Parallel Execution Safety:** Ensure no race conditions in parallel builds

**Commands to Execute:**
```bash
turbo run lint --dry-run     # Verify lint task exists
turbo run test --dry-run     # Verify test task exists
turbo run build --dry-run    # Verify build orchestration
```

**Blocking Conditions:**
- `turbo.json` missing or malformed
- Task dependencies form cycles
- Cache configuration could cause stale builds

#### 3.2 tsup Build Configuration
**Scope:** Validate TypeScript bundler output matches package.json exports.

**Required Checks:**
- ✅ **tsup.config.ts Validation:** Parse tsup configuration
- ✅ **Entry Points Match Exports:** Every `exports` entry has corresponding tsup entry
- ✅ **Format Consistency:** tsup formats (`esm`, `cjs`) match package.json exports
- ✅ **Declaration Files:** `dts: true` is enabled for type generation
- ✅ **Source Maps:** Verify source maps are generated for debugging

**Evidence Required:**
```typescript
{
  "build_validation": {
    "tsup_config_valid": true,
    "entry_points_match": true,
    "formats": ["esm", "cjs"],
    "declarations_enabled": true,
    "source_maps_enabled": true,
    "bundle_size_warnings": [] // Advisory
  }
}
```

---

### 4. Framework-Specific Pattern Validation

#### 4.1 React Integration Patterns
**Scope:** Validate React hooks and patterns in `packages/react/`.

**Required Checks:**
- ✅ **Rules of Hooks Compliance:**
  - Hooks only called at top level (not in loops/conditions/nested functions)
  - Hooks only called from React functions or custom hooks
  - Hook names start with `use`
- ✅ **TanStack Query Patterns:**
  - `useQuery` keys are stable (no inline object literals without memo)
  - Query functions are properly typed
  - No missing error boundaries for suspense queries
- ✅ **React Hook Form Integration:**
  - Form schemas (Zod) match route parameter types
  - Resolver configuration is type-safe
- ✅ **Stale Closure Detection:** Flag potential stale closures in useEffect/useCallback

**Tools to Use:**
```bash
# If available in project:
eslint --ext .tsx packages/react/ --rule 'react-hooks/rules-of-hooks: error'
```

**Blocking Conditions:**
- Hooks called conditionally or in loops
- Missing dependencies in useEffect/useCallback that could cause stale closures
- Type mismatch between form schema and API contract

#### 4.2 Vue 3 Composition API Patterns
**Scope:** Validate Vue composables in `packages/vue/`.

**Required Checks:**
- ✅ **Reactivity Rules:**
  - `ref()`, `reactive()`, `computed()` used correctly
  - No destructuring reactive objects without `toRefs()`
  - No losing reactivity by reassigning refs
- ✅ **VeeValidate + Zod Integration:**
  - Form validation schemas match API contracts
  - `useForm()` configuration is type-safe
- ✅ **TanStack Query (Vue):**
  - Query keys properly typed and stable
  - Composables return reactive values
- ✅ **Lifecycle Hook Safety:** No side effects in computed() or watch() that violate Vue's reactivity model

**Blocking Conditions:**
- Destructured reactive props without toRefs()
- Refs reassigned (losing reactivity)
- Type mismatches in form validation schemas

---

### 5. CLI Tool Quality Gates

#### 5.1 Executable Validation
**Scope:** Validate `routesync` CLI binary in `dist/cli.js`.

**Required Checks:**
- ✅ **Shebang Presence:** First line MUST be `#!/usr/bin/env node`
- ✅ **File Permissions:** Binary has executable permissions (`chmod +x`)
- ✅ **Commander.js Configuration:** Validate command structure
- ✅ **Error Message Quality:**
  - All errors provide actionable guidance
  - Exit codes are semantic (0 = success, non-zero = failure)
- ✅ **Cross-Platform Path Handling:** Windows `\` vs Unix `/` handled correctly

**Evidence Required:**
```typescript
{
  "cli_validation": {
    "shebang_present": true,
    "executable_permissions": true,
    "commands_validated": ["generate", "init", "sync"],
    "error_messages_actionable": true,
    "cross_platform_safe": true
  }
}
```

#### 5.2 CLI Output Validation
**Required Checks:**
- ✅ **Progress Indicators:** Use `ora` for long-running operations
- ✅ **Color Usage:** Use `chalk` consistently for success/error/info messages
- ✅ **JSON Output Mode:** Support `--json` flag for machine-readable output
- ✅ **Verbose Mode:** Support `--verbose` for debugging

---

### 6. Code Generation Quality

#### 6.1 Generated Code Patterns
**Scope:** RouteSync generates TypeScript SDKs from Laravel routes - validate generator output quality.

**Required Checks:**
- ✅ **Type Narrowing Correctness:** Generated discriminated unions are exhaustive
- ✅ **Generic Constraint Satisfaction:** All generic types satisfy their constraints
- ✅ **Template Consistency:** Generated code follows consistent patterns
- ✅ **Source Map Accuracy:** If source maps reference Laravel routes, they're valid
- ✅ **Generated vs Hand-Written Distinction:** 
  - Generated files have clear markers (e.g., `// @generated`)
  - Don't apply same strict rules to generated code as hand-written

**Advisory Signals (Not Blocking):**
- Repetitive patterns in generated code (expected for generators)
- Long files (acceptable if generated)
- High cyclomatic complexity (acceptable if generated from complex routes)

#### 6.2 Contract IR Validation
**Scope:** Validate intermediate representation contracts (`routesync.contract-ir.json`).

**Required Checks:**
- ✅ **Schema Validity:** IR follows documented schema
- ✅ **Type Consistency:** Types in IR match generated TypeScript output
- ✅ **Resource Relationship Integrity:** Parent-child relationships are valid
- ✅ **HTTP Method Contracts:** All Laravel routes have valid HTTP methods

---

### 7. Dependency Health & Security

#### 7.1 Peer Dependency Validation
**Scope:** Validate peer dependencies for framework bindings.

**Required Checks:**
- ✅ **Version Range Compatibility:**
  ```json
  // packages/react/package.json
  "peerDependencies": {
    "react": "^19.2.7",              // Match actual usage
    "@tanstack/react-query": "^5.101.0"
  }
  ```
- ✅ **Peer Dependency Installation:** Warn if peer deps not installed in root
- ✅ **Breaking Change Detection:** Flag major version bumps in dependencies

#### 7.2 Security Scanning
**Required Checks:**
- ✅ **npm audit Integration:** Run `npm audit --json` and parse results
- ✅ **High/Critical Vulnerabilities:** BLOCK on high/critical CVEs in production dependencies
- ✅ **License Compatibility:** Check all dependencies have compatible licenses (MIT, Apache-2.0, BSD)

**Commands:**
```bash
npm audit --json --production
npm ls --json --depth=0  # Check for missing peer deps
```

---

### 8. Test Coverage & Quality

#### 8.1 Vitest Integration
**Scope:** Validate test setup and coverage.

**Required Checks:**
- ✅ **Vitest Config Present:** `vitest.config.ts` exists and is valid
- ✅ **Global Test Types:** `"vitest/globals"` in tsconfig types
- ✅ **Coverage Thresholds:** Enforce minimum coverage (configurable, default 80%)
- ✅ **Test Co-location:** Tests are near source files or in `__tests__` directories

**Coverage Thresholds (Advisory):**
```typescript
{
  "coverage": {
    "statements": 80,
    "branches": 75,
    "functions": 80,
    "lines": 80
  }
}
```

**Commands:**
```bash
vitest run --coverage --reporter=json
```

#### 8.2 Test Pattern Validation
**Required Checks:**
- ✅ **No `.only` in Committed Code:** Flag `describe.only()`, `it.only()`, `test.only()`
- ✅ **No `.skip` Without Comment:** Skipped tests must have explanation
- ✅ **Snapshot Tests Updated:** No failing snapshot tests

---

### 9. Bundle Size & Performance

#### 9.1 Bundle Size Budgets
**Scope:** Enforce size limits for published packages.

**Budget Thresholds:**
```typescript
{
  "@routesync/core": "50kb",      // Core logic
  "@routesync/sdk": "30kb",       // SDK generator
  "@routesync/react": "20kb",     // React bindings
  "@routesync/vue": "20kb",       // Vue bindings
  "@routesync/cli": "1mb"         // CLI (more lenient)
}
```

**Required Checks:**
- ✅ **Compressed Size:** Check gzip size of each export
- ✅ **Tree-Shaking Effectiveness:** Verify unused exports are eliminated
- ✅ **Side Effects Declaration:** `"sideEffects": false` in package.json where appropriate

**Tools:**
```bash
# If available:
npx size-limit
```

#### 9.2 Import Cost Analysis
**Advisory:** Flag unexpectedly large imports (e.g., importing entire lodash instead of specific functions).

---

### 10. Documentation Quality

#### 10.1 TSDoc Comment Coverage
**Scope:** Validate public API documentation.

**Required Checks:**
- ✅ **Public Exports Documented:** All exported classes/functions/types have TSDoc comments
- ✅ **Parameter Documentation:** All function parameters documented with `@param`
- ✅ **Return Type Documentation:** Return values documented with `@returns`
- ✅ **Example Code Validity:** Code in `@example` blocks is syntactically valid TypeScript

**Severity:** HIGH for missing docs on public APIs

#### 10.2 README Consistency
**Required Checks:**
- ✅ **Installation Instructions Match:** package.json name matches README install command
- ✅ **API Examples Valid:** Code examples in README are syntactically correct
- ✅ **Version Badges Updated:** Badges reference current version

---

## RouteSync Quality Gate Execution Workflow

### Pre-Implementation Phase
1. Read `package.json`, `tsconfig.json`, `turbo.json`, `tsup.config.ts`
2. Discover workspace packages in `packages/*`
3. Build workspace dependency graph
4. Identify changed files and affected packages

### Analysis Phase
5. **Core TypeScript Analysis** (from base skill)
   - Compiler diagnostics
   - Type safety checks
   - Import resolution
6. **RouteSync Extensions**
   - Workspace dependency validation
   - Export path validation
   - Framework pattern checks (React/Vue)
   - CLI validation
   - Generated code quality
7. **Build Tool Validation**
   - Run `turbo run lint --dry-run`
   - Run `turbo run test --dry-run`
   - Verify build artifacts match exports

### Evidence Collection
8. Generate structured evidence JSON with:
   - Base TypeScript quality metrics
   - Workspace dependency graph
   - Export validation results
   - Framework-specific findings
   - Build tool execution results
   - Security scan results

### Decision Phase
9. Compute final risk score (0-100)
10. Apply decision rules:
    - **BLOCKED:** Any blocking finding (circular deps, missing exports, high CVEs)
    - **PASS_WITH_WARNINGS:** Score >= 85, no blocking findings
    - **PASS:** Score >= 95, minimal warnings
    - **ANALYZER_UNAVAILABLE:** Compiler/tool failures

### Remediation Loop
11. If BLOCKED or warnings present:
    - Report findings with location + remediation steps
    - Wait for agent to fix issues
    - Re-run entire workflow
12. Exit when PASS or explicitly BLOCKED

---

## Configuration Override for RouteSync

Create `.kiro/skills/typescript-ai-quality-gate/routesync.config.json`:

```json
{
  "extensions": {
    "monorepo": {
      "enabled": true,
      "workspace_pattern": "packages/*",
      "enforce_dependency_direction": true
    },
    "frameworks": {
      "react": {
        "enabled": true,
        "strict_hooks_rules": true,
        "check_tanstack_query": true
      },
      "vue": {
        "enabled": true,
        "strict_reactivity": true,
        "check_vee_validate": true
      }
    },
    "cli": {
      "enabled": true,
      "bin_path": "dist/cli.js",
      "required_shebang": "#!/usr/bin/env node"
    },
    "bundle_size": {
      "enabled": true,
      "budgets": {
        "@routesync/core": "50kb",
        "@routesync/sdk": "30kb",
        "@routesync/react": "20kb",
        "@routesync/vue": "20kb",
        "@routesync/cli": "1mb"
      }
    },
    "coverage": {
      "enabled": true,
      "thresholds": {
        "statements": 80,
        "branches": 75,
        "functions": 80,
        "lines": 80
      }
    },
    "security": {
      "npm_audit": true,
      "block_on_high_severity": true,
      "allowed_licenses": ["MIT", "Apache-2.0", "BSD-3-Clause", "ISC"]
    }
  },
  "generated_code_markers": [
    "// @generated",
    "// This file is auto-generated",
    "/* eslint-disable */"
  ],
  "exclude_from_strict_checks": [
    "**/*.generated.ts",
    "**/dist/**",
    "**/__tests__/**"
  ]
}
```

---

## Trigger Phrases for RouteSync Extensions

When analyzing RouteSync code, activate these extensions if you see:

- `packages/` directory with multiple TypeScript projects → **Monorepo validation**
- `"workspaces"` in package.json → **Workspace dependency checks**
- `@routesync/*` imports → **Path mapping validation**
- `export` fields in package.json → **Multi-export validation**
- `turbo.json` present → **Turbo orchestration checks**
- `tsup.config.ts` present → **Bundle validation**
- `useQuery`, `useMutation` → **TanStack Query pattern checks**
- `useForm` from react-hook-form → **React form validation**
- `useForm` from vee-validate → **Vue form validation**
- `bin` field in package.json → **CLI validation**
- `.generated.ts` or `@generated` comments → **Generated code handling**
- `vitest.config.ts` → **Test coverage validation**

---

## Upgrade Summary

**Added Capabilities:**
1. ✅ Monorepo workspace dependency analysis
2. ✅ Multi-export package validation  
3. ✅ Turbo + tsup build integration
4. ✅ React Hooks pattern validation
5. ✅ Vue Composition API pattern validation
6. ✅ CLI tool quality checks
7. ✅ Generated code quality assessment
8. ✅ Dependency health scanning
9. ✅ Test coverage enforcement
10. ✅ Bundle size budgets
11. ✅ TSDoc documentation coverage

**Breaking Changes from v28.4:**
- Minimum quality score raised to 85 (from 80)
- Workspace circular dependencies are now BLOCKING (was WARNING)
- Missing export paths are now BLOCKING (was WARNING)
- High/Critical CVEs in production deps are now BLOCKING

**Backward Compatibility:**
- All v28.4 base checks still run
- Can disable RouteSync extensions via config
- Falls back gracefully if tools unavailable
