# Kiro: Known Bugs & Workarounds

## Critical Bug: Stdout/Stderr Capture Failure

### 🐛 Bug Description

**Kiro Runtime Agent fails to capture stdout/stderr from bash commands.**

**Symptoms:**
- `execute_bash` returns empty output even when command succeeds
- Exit codes are correct, but output is missing
- Affects ALL commands: `npm`, `node`, `ls`, `cat`, `grep`, etc.
- Bug exists regardless of `trustedCommands` configuration

**Evidence:**
- File: `/home/annas-zen/Documents/RouteSync/KIRO_BUG_REPORT_STDOUT_CAPTURE.md`
- Reproduced consistently across all command types
- Both direct output and redirected output (`2>&1`) fail

### ✅ Mandatory Workaround

**ALWAYS use `capture.sh` script for ANY command that needs output inspection.**

#### Script Location
```bash
./capture.sh
```

#### How It Works
```bash
#!/usr/bin/env bash
# Runs command and saves output to workspace log file
# Kiro can then read the log with read_file tool

WORKSPACE_LOG="./kiro-command-output.log"
"$@" >"$WORKSPACE_LOG" 2>&1
EXIT_CODE=$?
exit $EXIT_CODE
```

#### Usage Pattern

**Step 1: Run command with capture.sh**
```bash
./capture.sh <command> [args...]
```

**Step 2: Read output with read_file**
```
read_file: ./kiro-command-output.log
```

### 📋 Examples

#### npm commands
```bash
# Install dependencies
./capture.sh npm install --legacy-peer-deps

# Then read output
read_file: ./kiro-command-output.log
```

#### Build commands
```bash
# Build project
./capture.sh npm run build

# Read build output
read_file: ./kiro-command-output.log
```

#### Test commands
```bash
# Run tests
./capture.sh npm test

# Read test results
read_file: ./kiro-command-output.log
```

#### RouteSync CLI
```bash
# Generate SDK
./capture.sh node dist/cli.js generate --manifest test.json --output src/api

# Read generation output
read_file: ./kiro-command-output.log
```

#### Debugging commands
```bash
# List files
./capture.sh ls -la packages/

# Check git status
./capture.sh git status

# View recent logs
./capture.sh tail -n 50 npm-debug.log

# Then read captured output
read_file: ./kiro-command-output.log
```

### ⚠️ Common Mistakes to Avoid

#### ❌ DON'T: Run command directly expecting output
```bash
# This will return empty output (BUG)
execute_bash: npm install
```

#### ❌ DON'T: Use redirection without capture.sh
```bash
# This also fails (BUG persists)
execute_bash: npm install > log.txt 2>&1
execute_bash: cat log.txt  # Still empty!
```

#### ✅ DO: Always use capture.sh + read_file pattern
```bash
# Step 1: Capture
execute_bash: ./capture.sh npm install

# Step 2: Read
read_file: ./kiro-command-output.log
```

### 🔧 When to Use Workaround

**ALWAYS use for:**
- ✅ npm/yarn/pnpm commands
- ✅ Node.js script execution
- ✅ Build/test commands
- ✅ Git commands
- ✅ File listing/searching (ls, grep, find)
- ✅ Log file viewing (cat, tail, head)
- ✅ Any command where output matters

**Can skip for:**
- ❌ Commands where only exit code matters
- ❌ File operations (cp, mv, mkdir) - use dedicated tools instead
- ❌ Short verification commands (test -f, test -d)

## Context Summarization Best Practices

### 🎯 Essential Actions Before Summarization

When context is about to be summarized (approaching token limit), **MANDATORY checklist:**

#### 1. Save Work-in-Progress State
```bash
# Create snapshot of current work
./capture.sh git status
read_file: ./kiro-command-output.log

# Save uncommitted changes context
./capture.sh git diff --stat
read_file: ./kiro-command-output.log
```

#### 2. Document Current Task State
```markdown
# Create checkpoint file
CURRENT_TASK_CHECKPOINT.md

## What I Was Doing
- Task: [Current task description]
- Progress: [X% complete, blocked on Y]
- Next Steps: [Ordered list of remaining steps]

## Files Modified (Not Yet Committed)
- file1.ts: [What changed]
- file2.ts: [What changed]

## Commands to Resume Work
1. ./capture.sh npm test  # Verify current state
2. [Next command to run]

## Important Context to Remember
- [Critical decisions made]
- [Blockers encountered]
- [Workarounds applied]
```

#### 3. Run Verification Commands
```bash
# Build status
./capture.sh npm run build
read_file: ./kiro-command-output.log

# Test status
./capture.sh npm test
read_file: ./kiro-command-output.log

# TypeScript compilation
./capture.sh npx tsc --noEmit
read_file: ./kiro-command-output.log
```

#### 4. Archive Key Artifacts
```bash
# Copy important generated files to timestamped backups
cp -r test-output test-output-$(date +%Y%m%d-%H%M%S)

# Document artifact locations
echo "Artifacts backed up to: test-output-$(date +%Y%m%d-%H%M%S)" >> CHECKPOINT.md
```

### 📝 Summarization Hooks

**Create these hooks for automatic checkpointing:**

#### Hook 1: Pre-Context-Limit Warning
```json
{
  "name": "Context Limit Warning",
  "version": "1.0.0",
  "when": {
    "type": "userTriggered"
  },
  "then": {
    "type": "askAgent",
    "prompt": "Context is approaching limit. Create CURRENT_TASK_CHECKPOINT.md with: 1) Current task state, 2) Files modified, 3) Commands to resume, 4) Important context. Then run verification commands with capture.sh and save outputs."
  }
}
```

#### Hook 2: Build Verification Before Summarization
```json
{
  "name": "Pre-Summarization Build Check",
  "version": "1.0.0",
  "when": {
    "type": "userTriggered"
  },
  "then": {
    "type": "runCommand",
    "command": "./capture.sh npm run build"
  }
}
```

#### Hook 3: Test Status Before Summarization
```json
{
  "name": "Pre-Summarization Test Check",
  "version": "1.0.0",
  "when": {
    "type": "userTriggered"
  },
  "then": {
    "type": "runCommand",
    "command": "./capture.sh npm test"
  }
}
```

### 🎓 Skills to Activate

**Before summarization, consider activating:**

1. **compiler-bridge-architecture** - If working on compiler code
2. **reverse-engineering** - If analyzing complex systems
3. **[Other project-specific skills]**

### 🔄 Recovery After Summarization

**When context is restored:**

1. **Read checkpoint file first**
   ```
   read_file: CURRENT_TASK_CHECKPOINT.md
   ```

2. **Review latest command outputs**
   ```
   read_file: ./kiro-command-output.log
   ```

3. **Check git status**
   ```bash
   ./capture.sh git status
   read_file: ./kiro-command-output.log
   ```

4. **Resume from documented next steps**

## Additional Workarounds

### File Reading Limitations

**Kiro can only read files within workspace or ~/.kiro directory.**

**Workaround:** Copy external files to workspace
```bash
# Copy external log to workspace
cp ~/.npm/_logs/latest-debug.log ./npm-error.log

# Now Kiro can read it
read_file: ./npm-error.log
```

### Long-Running Commands

**Never use execute_bash for long-running commands.**

**Use control_bash_process instead:**
```
# Start dev server
control_bash_process: action=start, command=npm run dev

# Check output
get_process_output: terminalId=[id]

# Stop when done
control_bash_process: action=stop, terminalId=[id]
```

### npm Peer Dependency Conflicts

**Common npm install failure with workspace monorepos.**

**Workaround:** Use `--legacy-peer-deps`
```bash
./capture.sh npm install --legacy-peer-deps
read_file: ./kiro-command-output.log
```

## Automated Reminder System

### Environment Variable Pattern

**Set reminder in shell profile:**
```bash
# ~/.bashrc or ~/.zshrc
export KIRO_CAPTURE_REMINDER="REMEMBER: Use ./capture.sh for all commands!"

# Display on Kiro session start
alias kiro-remind='echo $KIRO_CAPTURE_REMINDER'
```

### Visual Reminder in Workspace

**Create reminder file:**
```bash
# .kiro/REMINDERS.md
# ⚠️  CRITICAL REMINDERS

## Always Use capture.sh
- Run: ./capture.sh <command>
- Read: read_file ./kiro-command-output.log

## Before Context Summarization
1. Create CURRENT_TASK_CHECKPOINT.md
2. Run verification commands
3. Backup important artifacts
4. Document next steps
```

## Troubleshooting

### Issue: capture.sh not executable
```bash
chmod +x capture.sh
```

### Issue: Log file not updating
```bash
# Check if command actually ran
echo $?  # Should show exit code

# Manually verify log exists
ls -la kiro-command-output.log

# Force recreate script
rm capture.sh
# [Recreate script from template]
```

### Issue: Output truncated
```bash
# Log file has complete output
# Use tail/head to view specific sections
./capture.sh tail -n 100 kiro-command-output.log
read_file: ./kiro-command-output.log
```

## Bug Reporting

**If capture.sh workaround fails:**

1. Document exact command run
2. Check exit code
3. Verify log file content manually
4. Report to Kiro team with reproduction steps

## Summary

### The Golden Rule

**🏆 ALWAYS use capture.sh + read_file for ANY command needing output inspection.**

### Pre-Summarization Checklist

- [ ] Created CURRENT_TASK_CHECKPOINT.md
- [ ] Ran build verification with capture.sh
- [ ] Ran test verification with capture.sh
- [ ] Documented modified files
- [ ] Listed next steps clearly
- [ ] Backed up important artifacts
- [ ] Saved all command outputs to log

### Recovery Checklist

- [ ] Read CURRENT_TASK_CHECKPOINT.md
- [ ] Review kiro-command-output.log
- [ ] Check git status with capture.sh
- [ ] Resume from documented next steps
- [ ] Reactivate relevant skills if needed

---

**Last Updated:** 2026-08-06  
**Status:** Active - Critical workarounds for Kiro v1.x  
**Priority:** P0 - Must follow for reliable operation
