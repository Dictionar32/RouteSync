# Packaging contract

The ZIP root is the project root. The release root is `quality-gate-v28/`.

Self-test must be runnable with:

    bash self-tests/run.sh

from the extracted release root.

Generated attestation files are stored outside the repository being measured during tests, so test artifacts cannot mutate their own snapshot.

All release metadata, policy, schema, skill, self-tests, and parser lineage must agree on 28.4.0. Historical changelogs retain their original version numbers.

### Final19 release hygiene
Final19 excludes Python bytecode/cache artifacts. The release self-test is watchdog-bounded. Semantic TypeScript verification and contextual security classification are part of the release contract.
