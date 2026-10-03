# Phase 413 Research and Migration Notes

Phase 413 adopts a stricter interpretation of declarative semantic authority.

MLIR PDLL explicitly models matching and rewriting as declarative patterns; PDL makes the
pattern machinery itself representable as IR. Soufflé models typed facts as relations, while
egglog combines Datalog with equality saturation. Spoofax demonstrates a language workbench
where syntax and static semantics are declaratively specified and implementation artifacts are
generated.

RouteSync therefore treats scanner/resolver code as a relation-producing front-end, not as the
place where semantic decisions are encoded through host-language control flow.

The immediate frontier is scanner/lexer and resolver code, with `queryEvidenceProducer` and
`astClassifierEvidence` receiving the next complete Option/presence migration. The migration
must preserve typed witnesses and evidence traces rather than merely changing surface syntax.
