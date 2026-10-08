#!/bin/bash

# Script untuk mengorganisir file .md dari packages/core/src ke docs/

WORKSPACE="/home/annas-zen/Documents/RouteSync"
LOGFILE="organize-md-files.log"

echo "=====================================" | tee "$LOGFILE"
echo "Organizing MD Files - $(date)" | tee -a "$LOGFILE"
echo "=====================================" | tee -a "$LOGFILE"
echo "" | tee -a "$LOGFILE"

# Fungsi untuk membuat folder jika belum ada
ensure_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        echo "Created directory: $1" | tee -a "$LOGFILE"
    fi
}

# Struktur domain untuk docs/
declare -A domain_map=(
    # Compiler modules
    ["packages/core/src/compiler/analysis"]="docs/compiler/analysis"
    ["packages/core/src/compiler/artifacts"]="docs/compiler/artifacts"
    ["packages/core/src/compiler/ast"]="docs/compiler/ast"
    ["packages/core/src/compiler/cache"]="docs/compiler/cache"
    ["packages/core/src/compiler/constraints"]="docs/compiler/constraints"
    ["packages/core/src/compiler/diagnostics"]="docs/compiler/diagnostics"
    ["packages/core/src/compiler/emitters"]="docs/compiler/emitters"
    ["packages/core/src/compiler/fingerprint"]="docs/compiler/fingerprint"
    ["packages/core/src/compiler/ir"]="docs/compiler/ir"
    ["packages/core/src/compiler/optimization"]="docs/compiler/optimization"
    ["packages/core/src/compiler/passes"]="docs/compiler/passes"
    ["packages/core/src/compiler/pipeline"]="docs/compiler/pipeline"
    ["packages/core/src/compiler/query"]="docs/compiler/query"
    ["packages/core/src/compiler/result"]="docs/compiler/result"
    ["packages/core/src/compiler/types"]="docs/compiler/types"
    ["packages/core/src/compiler/utils"]="docs/compiler/utils"
    ["packages/core/src/compiler/verification"]="docs/compiler/verification"
    
    # Scanner modules
    ["packages/core/src/compiler/scanner/audit"]="docs/scanner/audit"
    ["packages/core/src/compiler/scanner/lexer"]="docs/scanner/lexer"
    ["packages/core/src/compiler/scanner/lexer/routeAst"]="docs/scanner/lexer/route-ast"
    ["packages/core/src/compiler/scanner/subscanners"]="docs/scanner/subscanners"
    ["packages/core/src/compiler/scanner/subscanners/resource"]="docs/scanner/subscanners/resource"
    
    # Graph modules
    ["packages/core/src/graph/service"]="docs/graph/service"
    
    # Root level phases (packages/core/src/PHASE*.md)
    ["packages/core/src"]="docs/phases/core"
)

# Buat semua direktori yang diperlukan
for target_dir in "${domain_map[@]}"; do
    ensure_dir "$WORKSPACE/$target_dir"
done

echo "" | tee -a "$LOGFILE"
echo "Moving files..." | tee -a "$LOGFILE"
echo "" | tee -a "$LOGFILE"

MOVED_COUNT=0
SKIPPED_COUNT=0

# Proses setiap file .md
while IFS= read -r -d '' source_file; do
    # Skip node_modules
    if [[ "$source_file" == *"/node_modules/"* ]]; then
        continue
    fi
    
    REL_PATH="${source_file#$WORKSPACE/}"
    FILENAME=$(basename "$source_file")
    
    # Tentukan target directory berdasarkan path
    TARGET_DIR=""
    for src_pattern in "${!domain_map[@]}"; do
        if [[ "$REL_PATH" == "$src_pattern"/* ]] || [[ "$REL_PATH" == "$src_pattern/$FILENAME" ]]; then
            TARGET_DIR="${domain_map[$src_pattern]}"
            break
        fi
    done
    
    # Jika tidak ada mapping khusus untuk file di root src/, tetap di docs/phases/core
    if [ -z "$TARGET_DIR" ] && [[ "$REL_PATH" == "packages/core/src/"* ]] && [[ "$REL_PATH" != *"/"*"/"* ]]; then
        TARGET_DIR="docs/phases/core"
    fi
    
    if [ -n "$TARGET_DIR" ]; then
        TARGET_FILE="$WORKSPACE/$TARGET_DIR/$FILENAME"
        
        # Cek apakah file sudah ada di target
        if [ -f "$TARGET_FILE" ]; then
            echo "[SKIP] $FILENAME already exists in $TARGET_DIR" | tee -a "$LOGFILE"
            ((SKIPPED_COUNT++))
        else
            cp "$source_file" "$TARGET_FILE"
            echo "[MOVE] $REL_PATH -> $TARGET_DIR/$FILENAME" | tee -a "$LOGFILE"
            ((MOVED_COUNT++))
        fi
    else
        echo "[SKIP] No mapping for: $REL_PATH" | tee -a "$LOGFILE"
        ((SKIPPED_COUNT++))
    fi
    
done < <(find "$WORKSPACE/packages/core/src" -type f -name "*.md" -print0 2>/dev/null | sort -z)

echo "" | tee -a "$LOGFILE"
echo "=====================================" | tee -a "$LOGFILE"
echo "Summary:" | tee -a "$LOGFILE"
echo "  Files moved: $MOVED_COUNT" | tee -a "$LOGFILE"
echo "  Files skipped: $SKIPPED_COUNT" | tee -a "$LOGFILE"
echo "=====================================" | tee -a "$LOGFILE"

echo "" | tee -a "$LOGFILE"
echo "Organization complete. Check $LOGFILE for details." | tee -a "$LOGFILE"
