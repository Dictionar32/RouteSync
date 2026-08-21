# v26 hardening

This patch hardens v26 around independent semantic verification:
- recompute canonical finding summary;
- recompute failure taxonomy;
- compare attested errors to independently derived errors;
- recompute expected decision;
- recompute trust state;
- bind VERIFIED artifacts to the source attestation digest;
- semantic tampering self-test fails closed when its fixture is missing;
- explicit unavailable-tool evidence for required adapters.

The next release can focus on deeper parser, AST reuse, semantic diff, and per-function complexity.
