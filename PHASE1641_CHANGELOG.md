# Phase 1641 — Invocation Dependency Slice

- Upgraded `InvocationSemanticContract` to version 3 with explicit target/callable/emission dependency-slice policy.
- Replaced the single-invocation path's aggregate-algebra call with direct construction of exactly one invocation judgment.
- Filtered callable-target data-flow before relation rewrite.
- Restricted callable knowledge to identities targeted by the requested invocation's evidence.
- Restricted emission knowledge to emissions declared by those resolved callables.
- Kept unresolved evidence, obligation typing, full rule trace, proof, and closure in upstream algebra.
- Kept scanner facade and runtime executor as delegation-only boundaries.
- Updated Phase 1640 audit and added Phase 1641 dependency-slice audit.
- Static audits: 15/15 checks passed across both audits.
- Targeted TypeScript 5.8.3 no-emit check passed for changed algebra, authority, runtime executor, and scanner facade.
- Full repository build/runtime suite remains unverified because repository dependencies are not installed in the workspace.
