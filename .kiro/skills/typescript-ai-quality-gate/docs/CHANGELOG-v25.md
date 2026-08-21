# v26 audit remediation

v26 addresses the v24 audit by:
- canonical first-class findings for style/reuse/architecture/complexity;
- immutable policy source content embedded in the attestation and independently reconstructed during verification;
- current filesystem policy used only for drift detection;
- parent repository identity lineage checks;
- stronger local TypeScript import resolution;
- explicit adapter contracts with parser identities;
- independently recomputed complexity and complexity delta;
- structured failure taxonomy improvements;
- separate VERIFIED attestation output after independent verification;
- version lineage raised to 26.0.0;
- adversarial self-test for complexity-delta tampering.

The original run attestation remains immutable; verification writes a separate artifact when requested.
