#!/usr/bin/env bash
set -euo pipefail
if [[ "${V28_RUNX_WATCHDOG:-0}" != 1 ]] && command -v timeout >/dev/null 2>&1; then
  V28_RUNX_TIMEOUT="${V28_RUNX_TIMEOUT:-300}"
  exec env V28_RUNX_WATCHDOG=1 timeout --kill-after=5s "${V28_RUNX_TIMEOUT}s" bash "$0" "$@"
fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo 'RUNX_STAGE_START:stabilization'
PYTHONPATH="$ROOT" python3 -u "$ROOT/self-tests/stabilization_gate.py"
echo 'RUNX_STAGE_PASS:stabilization'
echo 'RUNX_STAGE_START:semantic'
PYTHONPATH="$ROOT" python3 -u "$ROOT/engine/selftest_v28_semantic.py"
echo 'RUNX_STAGE_PASS:semantic'
echo 'RUNX_STAGE_START:independent-verifier'
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
REPO="$TMP/repo"; mkdir -p "$REPO"
printf '%s\n' '{"scripts":{"test":"true"}}' > "$REPO/package.json"
printf '%s\n' 'final40-independent' > "$REPO/README.md"
PYTHONPATH="$ROOT" python3 "$ROOT/bin/quality-run.py" "$REPO" "$TMP/a.json" >/dev/null
PYTHONPATH="$ROOT" python3 "$ROOT/bin/quality-verify.py" "$TMP/a.json" "$REPO" "$ROOT/schemas/attestation.schema.json"
echo 'RUNX_STAGE_PASS:independent-verifier'
echo 'ALL V28.4 AUDIT SELF-TESTS PASS'
echo 'TSQ INDEPENDENT VERIFICATION TESTS PASS'
