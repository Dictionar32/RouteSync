#!/usr/bin/env bash
# Kiro stdout capture workaround
# Usage: ./capture.sh <command> [args...]
# 
# This script works around Kiro's stdout capture bug by:
# 1. Running command and saving output to workspace log file
# 2. Returning proper exit code
# 3. Kiro can then read the log file with read_file tool

# Save log in workspace (not /tmp) so Kiro can read it
WORKSPACE_LOG="./kiro-command-output.log"

# Run command and capture all output to workspace log
"$@" >"$WORKSPACE_LOG" 2>&1
EXIT_CODE=$?

# Print summary for human readability (won't show in Kiro due to bug)
echo "Command executed: $*"
echo "Exit code: $EXIT_CODE"
echo "Output saved to: $WORKSPACE_LOG"
echo ""
echo "To view output, run:"
echo "  cat $WORKSPACE_LOG"
echo "Or Kiro can read it with read_file tool"

# Return original exit code
exit $EXIT_CODE
