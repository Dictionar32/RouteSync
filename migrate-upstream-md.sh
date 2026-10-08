#!/bin/bash

# Script untuk memindahkan file .md dari packages/core/src/types/upstream ke docs
# Log akan disimpan ke file migrasi-md-upstream.log

LOG_FILE="migrate-md-upstream.log"
SOURCE_DIR="packages/core/src/types/upstream"
DEST_BASE="docs/upstream"

# Membuat direktori tujuan jika belum ada
mkdir -p "$DEST_BASE"

# Header log
echo "========================================" > "$LOG_FILE"
echo "MIGRASI FILE .md DARI $SOURCE_DIR" >> "$LOG_FILE"
echo "Tanggal: $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Mencari semua file .md di upstream
echo "Mencari file .md di $SOURCE_DIR..." | tee -a "$LOG_FILE"
find "$SOURCE_DIR" -name "*.md" -type f | while read -r md_file; do
    echo "Ditemukan: $md_file" >> "$LOG_FILE"
done

echo "" >> "$LOG_FILE"
echo "File .md yang ditemukan:" | tee -a "$LOG_FILE"
find "$SOURCE_DIR" -name "*.md" -type f | tee -a "$LOG_FILE"

echo "" >> "$LOG_FILE"
echo "Jumlah total: $(find "$SOURCE_DIR" -name "*.md" -type f | wc -l)" | tee -a "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Memindahkan file-file tersebut
echo "Memulai migrasi file .md..." | tee -a "$LOG_FILE"
echo "----------------------------------------" >> "$LOG_FILE"

find "$SOURCE_DIR" -name "*.md" -type f | while read -r md_file; do
    # Mendapatkan nama file saja
    filename=$(basename "$md_file")
    
    # Membuat path tujuan
    dest_path="$DEST_BASE/$filename"
    
    # Memindahkan file
    echo "Memindahkan: $md_file" | tee -a "$LOG_FILE"
    echo "     Ke: $dest_path" >> "$LOG_FILE"
    
    # Cek apakah file sudah ada di tujuan
    if [ -f "$dest_path" ]; then
        echo "  PERINGATAN: File $dest_path sudah ada, skipping..." | tee -a "$LOG_FILE"
    else
        mv "$md_file" "$dest_path"
        if [ $? -eq 0 ]; then
            echo "  SUKSES: File dipindahkan" | tee -a "$LOG_FILE"
        else
            echo "  ERROR: Gagal memindahkan file" | tee -a "$LOG_FILE"
        fi
    fi
    
    echo "" >> "$LOG_FILE"
done

echo "----------------------------------------" >> "$LOG_FILE"
echo "Migrasi selesai!" | tee -a "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Verifikasi akhir
echo "Verifikasi akhir:" | tee -a "$LOG_FILE"
echo "File .md yang tersisa di $SOURCE_DIR:" | tee -a "$LOG_FILE"
find "$SOURCE_DIR" -name "*.md" -type f | tee -a "$LOG_FILE"

echo "" >> "$LOG_FILE"
echo "File .md yang sekarang ada di $DEST_BASE:" | tee -a "$LOG_FILE"
find "$DEST_BASE" -name "*.md" -type f | tee -a "$LOG_FILE"

echo "" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
echo "Log lengkap tersedia di: $LOG_FILE" | tee -a "$LOG_FILE"