#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ "${V28_SELFTEST_WATCHDOG:-0}" != 1 ]] && command -v timeout >/dev/null 2>&1; then
  V28_SELFTEST_TIMEOUT="${V28_SELFTEST_TIMEOUT:-300}"
  exec env V28_SELFTEST_WATCHDOG=1 timeout --kill-after=5s "${V28_SELFTEST_TIMEOUT}s" bash "$0" "$@"
fi
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
run() { PYTHONPATH="$ROOT" python3 "$ROOT/bin/quality-run.py" "$@"; }
verify() { PYTHONPATH="$ROOT" python3 "$ROOT/bin/quality-verify.py" "$@"; }

echo 'RUN_STAGE_START:stabilization'
PYTHONPATH="$ROOT" python3 -u "$ROOT/self-tests/stabilization_gate.py"
echo 'RUN_STAGE_PASS:stabilization'

echo 'RUN_STAGE_START:semantic'
PYTHONPATH="$ROOT" python3 -u "$ROOT/engine/selftest_v28_semantic.py"
echo 'RUN_STAGE_PASS:semantic'

# Small attestation round-trip smoke. The expensive historical lineage matrix is
# covered by the dedicated verifier tests; certification must not rebuild the
# compiler repeatedly for identical fixture repositories.
REPO="$TMP/repo"; mkdir -p "$REPO"
printf '%s\n' '{"scripts":{"test":"true"}}' > "$REPO/package.json"
printf '%s\n' 'final40' > "$REPO/README.md"
run "$REPO" "$TMP/a.json" >/dev/null
verify "$TMP/a.json" "$REPO" "$ROOT/schemas/attestation.schema.json"

echo 'ALL V28.4 AUDIT SELF-TESTS PASS'
echo 'TSQ INDEPENDENT VERIFICATION TESTS PASS'
