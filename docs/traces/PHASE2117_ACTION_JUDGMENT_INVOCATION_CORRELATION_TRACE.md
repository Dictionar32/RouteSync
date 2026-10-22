# Phase 2117 — Invocation/Action Correlation Trace

The action semantic judgment previously accepted `sourceFile` independently from the invocation judgment. The execution input also accepted `invocationJudgment` beside `semanticJudgment`. Those parallel fields made the type contract permit a mismatch even though the scanner normally supplied matching values.

The revised contract gives the invocation judgment one upstream owner:

1. `LaravelControllerActionSemanticJudgmentInput` carries `invocationJudgment`.
2. The input no longer carries a duplicate `sourceFile`.
3. The completed `LaravelControllerActionSemanticJudgment` retains the exact `invocationJudgment`; consumers derive its source identity from that judgment rather than a duplicate field.
4. `LaravelControllerActionExecutionInput` carries only the completed action judgment.
5. The execution result forwards the invocation judgment from that action judgment.

This preserves the invocation outcome's discriminant and prevents the executor API from accepting two independently supplied judgments. The AST parenthesized rule already uses a typed judgment branch, invocation/response outcomes remain correlated, and fixed-point APIs expose convergence versus round-limit outcomes. The transitive graph still reaches `semantic/relations` and controller/resource subscanners. The production judgment implementation still adapts `scanControllerAction`; removing that legacy semantic owner is an outstanding migration, not a completed claim.
