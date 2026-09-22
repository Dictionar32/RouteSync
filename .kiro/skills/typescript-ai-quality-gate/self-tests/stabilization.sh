#!/usr/bin/env bash
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TIMEOUT="${V28_STABILIZATION_TIMEOUT:-300}"
rc=0
printf '%s\n' 'FINAL40_STABILIZATION_START'
if command -v timeout >/dev/null 2>&1; then
  timeout --kill-after=5s "${TIMEOUT}s" env PYTHONPATH="$ROOT" python3 -u "$ROOT/self-tests/stabilization_gate.py"
  r=$?
else
  env PYTHONPATH="$ROOT" python3 -u "$ROOT/self-tests/stabilization_gate.py"
  r=$?
fi
if [[ $r -ne 0 ]]; then
  printf 'FINAL40_STABILIZATION_FAIL:%s\n' "$r" >&2
  exit "$r"
fi
printf '%s\n' 'FINAL40_STABILIZATION_PASS'
