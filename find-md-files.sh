#!/bin/bash

# Script untuk mencari semua file .md di packages/core/ dan menuliskannya ke log

LOGFILE="md-files-inventory.log"
WORKSPACE="/home/annas-zen/Documents/RouteSync"

echo "=====================================" > "$LOGFILE"
echo "MD Files Inventory - $(date)" >> "$LOGFILE"
echo "=====================================" >> "$LOGFILE"
echo "" >> "$LOGFILE"

echo "Searching for .md files in packages/core/..." | tee -a "$LOGFILE"
echo "" >> "$LOGFILE"

# Cari semua file .md di packages/core
echo "## Files found in packages/core/:" >> "$LOGFILE"
echo "" >> "$LOGFILE"

MD_COUNT=0
while IFS= read -r -d '' file; do
    ((MD_COUNT++))
    # Dapatkan path relatif
    REL_PATH="${file#$WORKSPACE/}"
    echo "[$MD_COUNT] $REL_PATH" >> "$LOGFILE"
    
    # Dapatkan ukuran file
    SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    echo "    Size: $SIZE bytes" >> "$LOGFILE"
    
    # Dapatkan 3 baris pertama untuk preview
    echo "    Preview:" >> "$LOGFILE"
    head -n 3 "$file" | sed 's/^/    | /' >> "$LOGFILE"
    echo "" >> "$LOGFILE"
done < <(find "$WORKSPACE/packages/core" -type f -name "*.md" -print0 2>/dev/null | sort -z)

echo "" >> "$LOGFILE"
echo "=====================================" >> "$LOGFILE"
echo "Total .md files found: $MD_COUNT" >> "$LOGFILE"
echo "=====================================" >> "$LOGFILE"

# Tampilkan hasil
echo ""
echo "Search completed. Total files found: $MD_COUNT"
echo "Results written to: $LOGFILE"
echo ""
cat "$LOGFILE"
