#!/bin/bash

# Script untuk mencari file .md yang masih ada di packages/core/src

LOGFILE="remaining-md-files.log"

echo "=====================================" > "$LOGFILE"
echo "Remaining MD Files Search - $(date)" >> "$LOGFILE"
echo "=====================================" >> "$LOGFILE"
echo "" >> "$LOGFILE"

echo "Searching for .md files still in packages/core/src..." | tee -a "$LOGFILE"
echo "" >> "$LOGFILE"

# Cari semua file .md di packages/core/src (exclude node_modules)
find packages/core/src -type f -name "*.md" ! -path "*/node_modules/*" 2>/dev/null | sort > temp_files.txt

TOTAL_FILES=$(wc -l < temp_files.txt)

echo "## Total files found: $TOTAL_FILES" >> "$LOGFILE"
echo "" >> "$LOGFILE"

if [ "$TOTAL_FILES" -gt 0 ]; then
    echo "Listing files..." >> "$LOGFILE"
    echo "" >> "$LOGFILE"
    
    while IFS= read -r file; do
        FILENAME=$(basename "$file")
        REL_PATH="${file#packages/core/src/}"
        
        # Cek apakah file sudah ada di docs/
        FOUND_IN_DOCS=""
        
        # Cari di struktur docs/
        if find docs -name "$FILENAME" 2>/dev/null | grep -q "."; then
            FOUND_IN_DOCS=$(find docs -name "$FILENAME" -exec dirname {} \; 2>/dev/null | head -1)
        fi
        
        if [ -n "$FOUND_IN_DOCS" ]; then
            echo "[IN DOCS] $REL_PATH → Already in $FOUND_IN_DOCS/" >> "$LOGFILE"
        else
            echo "[MISSING] $REL_PATH" >> "$LOGFILE"
        fi
    done < temp_files.txt
    
    echo "" >> "$LOGFILE"
    echo "Summary of missing files:" >> "$LOGFILE"
    echo "" >> "$LOGFILE"
    
    # Hitung jumlah file yang missing
    MISSING_COUNT=$(grep -c "\[MISSING\]" "$LOGFILE" || echo "0")
    
    if [ "$MISSING_COUNT" -gt 0 ]; then
        grep "\[MISSING\]" "$LOGFILE" | sed 's/\[MISSING\] //' | head -20 >> "$LOGFILE"
        echo "" >> "$LOGFILE"
        echo "Total missing: $MISSING_COUNT files" >> "$LOGFILE"
    else
        echo "✅ All files are already in docs/" >> "$LOGFILE"
    fi
else
    echo "No .md files found in packages/core/src (excluding node_modules)" >> "$LOGFILE"
fi

echo "" >> "$LOGFILE"
echo "=====================================" >> "$LOGFILE"

rm -f temp_files.txt

# Tampilkan hasil
echo ""
echo "Search completed."
echo "Results written to: $LOGFILE"
echo ""
cat "$LOGFILE"
