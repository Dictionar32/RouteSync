# Scanner/Resolver Research — Phase 397

The external design pattern used for this phase is declarative matching + constraints + rewrite/projection.

MLIR PDLL documents patterns as a match section followed by a rewrite section and supports reusable constraints. MLIR DRR similarly describes rewrite rules declaratively. egglog combines equality saturation with Datalog, which is a useful reference for RouteSync's longer-term combination of candidate relations and rewrite closure.

RouteSync applies the principle at the scanner boundary:

1. tokenize source into evidence;
2. derive candidate facts;
3. represent absence with a typed relation witness;
4. traverse by recursive relation closure;
5. project the resolved witness into canonical AST.

The next high-value frontier remains `astClassifierEvidence.ts`, followed by the remaining resolver families and query evidence production. A lexical purge alone is explicitly not treated as architectural completion.
