#!/usr/bin/env bash
#
# test-suite.sh — automated regression test buat ReadEmitter/ContractGenerator
#
# BEDA sama test-regression.sh versi lama: script ini pake fixture manifest
# STATIS (test-manifest-fixture.json, disertakan di sini) — ga butuh PHP,
# DB, atau project Laravel apa pun buat dijalanin. Fixture-nya real data
# (dari project toko-online), jadi tetep ngetest kasus-kasus yang genuinely
# rumit (bukan data sintetis yang di-simplify).
#
# CAKUPAN: bug #1-12, #15 (semua yang murni di sisi TypeScript: ReadEmitter,
# ContractGenerator, ContractIRBuilder, manifest-enricher, resource-naming).
# TIDAK mencakup bug #11 (linkage awal), #13 (incremental cache), #14/#16-18
# (ResponseDescriptor Fase 1/3/4/5) — itu semua di sisi PARSER PHP
# (LaravelRouteParser.ts, incremental.ts), yang butuh PHP+DB buat dites,
# di luar scope test suite berbasis-fixture ini. Fixture-nya sendiri
# direkam SEBELUM fix-fix parser itu, jadi ga punya field transport/shape/
# status/contentType — itu bukan bug, itu memang batas cakupan file ini.
#
# CARA PAKAI:
#   1. Taruh script ini + test-manifest-fixture.json di root repo RouteSync
#      (yang isinya packages/core, packages/cli, dst — sudah di-build
#      dengan npx tsup dan dist/cli.js ada)
#   2. Jalankan: bash test-suite.sh
#
# Exit code 0 = semua PASS. Exit code 1 = ada yang FAIL (regresi).
#
# Kalau lu abis ubah salah satu dari 6 file source (lihat README.md),
# WAJIB jalanin ini sebelum lanjut — beberapa fix di sesi debugging asal
# saling tarik-menarik (bug #8: benerin 1 kasus, ngerusak kasus lain),
# jadi regresi silent itu risiko nyata, bukan teoretis.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURE="${1:-$SCRIPT_DIR/test-manifest-fixture.json}"
OUTDIR="$(mktemp -d)"
API_READ="$OUTDIR/types/api-read.ts"
PASS=0
FAIL=0

red()   { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }

assert_true() {
    local desc="$1" cond="$2"
    if eval "$cond"; then
        green "  ✓ PASS: $desc"
        PASS=$((PASS+1))
    else
        red   "  ✗ FAIL: $desc"
        FAIL=$((FAIL+1))
    fi
}

interface_body() {
    sed -n "/^export interface $1 {/,/^        }/p" "$API_READ"
}

count_matches() {
    grep -c "$1" "$API_READ" 2>/dev/null
    return 0
}

echo "=================================================================="
echo " Setup"
echo "=================================================================="
if [ ! -f "$FIXTURE" ]; then
    red "Fixture not found: $FIXTURE"
    exit 1
fi
if [ ! -f "dist/cli.js" ]; then
    red "dist/cli.js not found — jalankan 'npx tsup' dulu di root repo RouteSync"
    exit 1
fi
node dist/cli.js generate-v2 -m "$FIXTURE" -o "$OUTDIR" > /tmp/generate-v2-test.log 2>&1
if [ ! -f "$API_READ" ]; then
    red "generate-v2 gagal, lihat /tmp/generate-v2-test.log"
    exit 1
fi
green "Generate OK -> $API_READ"
echo ""

echo "=================================================================="
echo " Bug #1+#2: Resource suffix tidak di-strip, ga collision sama model"
echo "=================================================================="
assert_true "OrderResourceTransformed ada (Resource class, suffix dipertahankan)" \
    '[ "$(count_matches "^export interface OrderResourceTransformed")" -eq 1 ]'
assert_true "Ga ada nama interface yang duplikat" \
    '[ "$(grep "^export interface" "$API_READ" | sort | uniq -d | wc -l)" -eq 0 ]'
echo ""

echo "=================================================================="
echo " Bug #3: manifest.models dibaca (bukan cuma manifest.resources)"
echo "=================================================================="
assert_true "OrderTransformed ada (dari manifest.models, reachable)" \
    '[ "$(count_matches "^export interface OrderTransformed")" -eq 1 ]'
assert_true "PaymentTransformed ada (dari manifest.models, reachable)" \
    '[ "$(count_matches "^export interface PaymentTransformed")" -eq 1 ]'
assert_true "ProdukItemTransformed ada (dari manifest.models, reachable)" \
    '[ "$(count_matches "^export interface ProdukItemTransformed")" -eq 1 ]'
echo ""

echo "=================================================================="
echo " Bug #4: datetime type case ga kelewat"
echo "=================================================================="
body="$(interface_body ProdukItemTransformed)"
assert_true "ProdukItemTransformed.createdAt bertipe 'string | null' (bukan unknown)" \
    'echo "$body" | grep -q "readonly createdAt: string | null"'
echo ""

echo "=================================================================="
echo " Bug #5: GET-fallback object routes dapat nama"
echo "=================================================================="
for iface in CategoriesTransformed OauthRedirectTransformed OauthCallbackTransformed \
             ProdukReviewsTransformed ProfileTransformed; do
    assert_true "$iface ada" \
        '[ "$(count_matches "^export interface '"$iface"'")" -eq 1 ]'
done
echo ""

echo "=================================================================="
echo " Bug #9+#10: inferModels() ga bikin duplikat palsu"
echo "=================================================================="
assert_true "RegisterTransformed TIDAK ada (duplikat palsu dari RegisterResponse)" \
    '[ "$(count_matches "^export interface RegisterTransformed {")" -eq 0 ]'
assert_true "RegisterResponseTransformed ada (yang asli)" \
    '[ "$(count_matches "^export interface RegisterResponseTransformed")" -eq 1 ]'
echo ""

echo "=================================================================="
echo " Bug #7+#8: Order TIDAK frankenstein dari banyak route beda shape"
echo "=================================================================="
body="$(interface_body OrderTransformed)"
assert_true "OrderTransformed punya kolom DB asli (userId, totalHarga, status)" \
    'echo "$body" | grep -q "readonly userId: number" && echo "$body" | grep -q "readonly totalHarga: number" && echo "$body" | grep -q "readonly status: string"'
assert_true "OrderTransformed TIDAK ke-polusi field checkout/cart" \
    '! echo "$body" | grep -q "produkItemId\|shippingNama"'
echo ""

echo "=================================================================="
echo " Bug #12: nested resource reference ke-link (bukan 'unknown')"
echo "=================================================================="
body="$(interface_body OrderResourceTransformed)"
assert_true "OrderResourceTransformed.items ter-link ke OrderDetailResourceTransformed[]" \
    'echo "$body" | grep -q "readonly items: OrderDetailResourceTransformed\[\]"'
echo ""

echo "=================================================================="
echo " Bug #18: nested inline object (shipping/promotion) → named interface"
echo "=================================================================="
assert_true "OrderShippingTransformed ada (bukan lagi anonymous inline)" \
    '[ "$(count_matches "^export interface OrderShippingTransformed {")" -eq 1 ]'
assert_true "OrderPromotionTransformed ada (bukan lagi anonymous inline)" \
    '[ "$(count_matches "^export interface OrderPromotionTransformed {")" -eq 1 ]'
body="$(interface_body OrderResourceTransformed)"
assert_true "OrderResourceTransformed.shipping ter-link ke OrderShippingTransformed (bukan inline {...})" \
    'echo "$body" | grep -q "readonly shipping: OrderShippingTransformed"'
assert_true "OrderResourceTransformed.promotion ter-link ke OrderPromotionTransformed (bukan inline {...})" \
    'echo "$body" | grep -q "readonly promotion: OrderPromotionTransformed"'
body_shipping="$(interface_body OrderShippingTransformed)"
assert_true "OrderShippingTransformed field-nya camelCase (kodePos, bukan kode_pos)" \
    'echo "$body_shipping" | grep -q "kodePos" && ! echo "$body_shipping" | grep -q "kode_pos"'
echo ""

echo "=================================================================="
echo " Final: hanya interface yang genuinely reachable yang tergenerate"
echo "=================================================================="
TOTAL=$(grep -c "^export interface" "$API_READ")
assert_true "Total interface = 19 (fixture ini spesifik — sesuaikan kalau fixture beda; naik dari 13 karena bug #18 nambah interface baru per nested object)" \
    '[ "$TOTAL" -eq 19 ]'
for iface in CategoryTransformed UserTransformed WishlistTransformed; do
    assert_true "$iface TIDAK ada (model DB murni, ga pernah jadi response di fixture ini)" \
        '[ "$(count_matches "^export interface '"$iface"'")" -eq 0 ]'
done
echo ""

echo "=================================================================="
printf " HASIL: "
if [ "$FAIL" -eq 0 ]; then
    green "$PASS PASS, $FAIL FAIL"
else
    red "$PASS PASS, $FAIL FAIL — ADA REGRESI, cek detail di atas"
fi
echo "=================================================================="

rm -rf "$OUTDIR"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1