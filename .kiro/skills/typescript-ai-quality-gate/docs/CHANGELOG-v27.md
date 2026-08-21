# v27 audit remediation

v27 addresses the v26 audit blockers:
- independent semantic decision verification;
- recomputed finding summary;
- recomputed failure taxonomy;
- errors and claims comparison;
- trust state bound to verification state;
- VERIFIED artifacts require a source-attestation digest;
- semantic self-test generates its own fixture and fails if fixture generation fails;
- bin entrypoints use stable project-root imports;
- required unavailable tools are represented explicitly;
- execution output is parsed into canonical diagnostic findings;
- adapter contracts expose parser/normalizer implementation status.

Deep AST reuse, full language-specific parsers, semantic diff, and per-function complexity remain subsequent intelligence work.
