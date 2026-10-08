# Phase 905 — Upstream Controller Inheritance Evidence

Phase 905 extends the controller upstream boundary with explicit PHP parent-class evidence.

- `ControllerDeclarationAst.inheritance` is closed: `none | class(name, source)`.
- The parser reads `extends` only from the class header, never from nested method bodies.
- Controller scanning resolves only parents that are actually present in the scanned controller corpus.
- Class-level `WithoutMiddleware` attributes from known parent controllers are inherited recursively into child controller policy evidence.
- Unknown parents and inheritance cycles produce no invented middleware policy.
- The existing route middleware resolver remains the authority for action applicability and effective middleware.

Laravel 13 documents that class-level `WithoutMiddleware` attributes are inherited by child controllers and only remove route middleware, not global middleware.
