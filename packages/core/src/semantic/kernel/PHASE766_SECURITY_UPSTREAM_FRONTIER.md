# Phase 766 — Security Upstream Semantic Frontier

## Diagnostic frontier

The Phase 765 build reached the next closed-interface mismatch:

- `RouteCapabilityContract.auth` was already canonical `TruthValue`.
- `RouteCapabilityContract.security.isProtected` remained a host `boolean` in the legacy domain security descriptor.
- The capability builder therefore still received a structurally lower security judgment.

This was not repaired by an assertion or by weakening the contract.

## Model elevation

Security is now modeled as an upstream semantic judgment:

`Laravel middleware evidence`
→ `RouteSecurityDescriptor`
→ `TruthValue + SecuritySchemeKind + Sequence<GuardName> + Sequence<AbilityName>`
→ `RouteSecurityResolution`
→ `RouteCapabilityContract`

The canonical upstream `RouteSecurityDescriptor` owns `TruthValue` and recursive `Sequence` collections. The former domain descriptor now points at that upstream algebra rather than defining a second security type.

`RouteSemanticFlowSecurityDescriptor` is retained only as a compatibility constructor over the canonical upstream judgment. It is not a second semantic authority.

## Boundary trace

Laravel ecommerce source workload
→ scanner/source evidence
→ closed `RouteAst`
→ upstream mapping judgments
→ resolver graph judgments
→ security/capability judgment
→ request/data-flow/analysis judgments
→ semantic type lowering
→ diagnostic judgment
→ relation closure/fixed point
→ declarative rewrite
→ canonical Laravel route semantics
→ Next.js target projection.

The security frontier now carries nominal truth instead of a free boolean at the semantic contract.

## Legacy status

The parsed-AST reservoirs remain empty, including the legacy semantic-resolution adapter. No parsed descriptor ontology was reintroduced.

The domain `authAndPolicy` module remains only because public compatibility exports and historical tests still name its constructors/registries. Its route-security descriptor authority has been removed: the canonical descriptor is upstream.

## Forbidden-host audit direction

Do not mechanically rewrite source-language evidence such as PHP `if`, `for`, `switch`, `null`, `??`, or `===` in scanner/parser evidence. The next semantic frontiers are instead:

1. resolver graph primitive lifting (`auth`, middleware and capability inputs);
2. AST/upstream mapping contracts;
3. analysis/data-flow judgments;
4. semantic type lowering;
5. diagnostic ADTs;
6. generic solver and declarative rewrite interfaces.

Host `if/for/while/switch`, collection combinators, nullish/undefined/null leakage, assertions, `unknown`, `any`, and free primitive contracts must be removed from those authority layers by replacing them with closed ADTs, relation folds/indexes, presence/absence judgments, and solver/rewrite rules.

## Research alignment

WebAssembly specifies validity declaratively over abstract syntax using typing judgments and deduction rules. MLIR PDL separates matching from rewriting and represents patterns as an IR. CompCert states compiler correctness as semantic preservation between source and generated code. RouteSync follows the same architectural direction at the routing-domain level.
