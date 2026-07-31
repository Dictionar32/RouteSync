#!/usr/bin/env bash
#
# test-regression.sh — reproduce & verify semua 10 bug fix di generate-v2 (ReadEmitter/Contract IR)
#
# CARA PAKAI:
#   1. Taruh script ini di root repo RouteSync (yang isinya packages/core, packages/cli, dst)
#   2. Pastikan 5 file source udah ditimpa sama versi yang di-fix
#      (01-resource-naming.ts, 02-ContractIRBuilder.ts, 03-ReadEmitter.ts,
#       04-manifest-enricher.ts, 05-ContractGenerator.ts)
#   3. Taruh test-manifest.json di folder yang sama (atau ganti path MANIFEST di bawah)
#   4. Jalankan: bash test-regression.sh
#
# Script ini:
#   - Build project (npx tsup)
#   - Jalanin `generate-v2` pake manifest test
#   - Assert tiap fix satu-satu (exit code != 0 kalau ada yang fail)
#
# Kalau lu mau lihat gimana bug-nya MUNCUL sebelum di-fix: checkout/revert salah satu
# dari 5 file source ke versi lama, terus jalanin script ini lagi — assertion yang
# relevan bakal FAIL, nunjukin persis bug mana yang balik.

set -uo pipefail

MANIFEST="${1:-test-manifest.json}"
OUTDIR="$(mktemp -d)"
API_READ="$OUTDIR/types/api-read.ts"
PASS=0
FAIL=0

red()   { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }
yellow(){ printf '\033[33m%s\033[0m\n' "$1"; }

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
    # ambil isi 1 interface dari api-read.ts, contoh: interface_body OrderTransformed
    sed -n "/^export interface $1 {/,/^        }/p" "$API_READ"
}

count_matches() {
    grep -c "$1" "$API_READ" 2>/dev/null || echo 0
}

echo "=================================================================="
echo " 0. Setup: build & generate"
echo "=================================================================="

if [ ! -f "$MANIFEST" ]; then
    red "Manifest not found: $MANIFEST"
    echo "Download test-manifest.json dari chat dan taruh di folder yang sama, atau:"
    echo "  bash test-regression.sh /path/to/routesync.manifest.json"
    exit 1
fi

echo "Building..."
npx tsup > /tmp/tsup-build.log 2>&1
if [ $? -ne 0 ]; then
    red "Build gagal, lihat /tmp/tsup-build.log"
    exit 1
fi
green "Build OK"

echo "Generating ke $OUTDIR ..."
node dist/cli.js generate-v2 -m "$MANIFEST" -o "$OUTDIR" > /tmp/generate-v2.log 2>&1
if [ ! -f "$API_READ" ]; then
    red "generate-v2 gagal bikin api-read.ts, lihat /tmp/generate-v2.log"
    exit 1
fi
green "Generate OK -> $API_READ"
echo ""

echo "=================================================================="
echo " Bug #1+#2: Duplicate interface (resourceBaseName suffix stripping)"
echo "=================================================================="
# Sebelum fix: OrderResource -> "Order" (suffix distrip), collapse & collide
# sama model Order. Sekarang harus ada 2 interface TERPISAH.
assert_true "OrderResourceTransformed ada (Resource class, suffix dipertahanin)" \
    '[ "$(count_matches "^export interface OrderResourceTransformed")" -eq 1 ]'
assert_true "OrderTransformed ada (DB model, nama bare)" \
    '[ "$(count_matches "^export interface OrderTransformed")" -eq 1 ]'
assert_true "Ga ada nama interface yang muncul lebih dari 1x (0 duplicate)" \
    '[ "$(grep "^export interface" "$API_READ" | sort | uniq -d | wc -l)" -eq 0 ]'
echo ""

echo "=================================================================="
echo " Bug #3: manifest.models ga pernah kebaca -> 21 model hilang"
echo "=================================================================="
for iface in CategoryTransformed UserTransformed WishlistTransformed OrderAmountTransformed \
             OrderDetailTransformed OrderFinancialTransformed OrderFulfillmentTransformed \
             OrderPromotionTransformed OrderShippingTransformed PaymentAmountTransformed \
             PaymentDetailTransformed PaymentGatewayTransformed ProductReviewTransformed \
             ProdukItemFrontendTransformed PromoCodeTransformed SocialAccountTransformed; do
    assert_true "$iface ada (dulu hilang total)" \
        '[ "$(count_matches "^export interface '"$iface"'")" -eq 1 ]'
done
echo ""

echo "=================================================================="
echo " Bug #4: datetime type kelewat -> createdAt/updatedAt jadi 'unknown'"
echo "=================================================================="
body="$(interface_body CategoryTransformed)"
assert_true "CategoryTransformed.createdAt bertipe 'string | null' (bukan 'unknown')" \
    'echo "$body" | grep -q "readonly createdAt: string | null"'
echo ""

echo "=================================================================="
echo " Bug #5: 5 interface GET-object (Categories, OauthRedirect, dll) hilang"
echo "=================================================================="
for iface in CategoriesTransformed OauthRedirectTransformed OauthCallbackTransformed \
             ProdukReviewsTransformed ProfileTransformed; do
    assert_true "$iface ada (dulu hilang, ga ada nama dari response object-kind)" \
        '[ "$(count_matches "^export interface '"$iface"'")" -eq 1 ]'
done
# Route non-GET yang SENGAJA harus tetap ga dapat nama (login, logout, wishlist, dll)
assert_true "LoginTransformed TIDAK ada (POST route, sengaja ga dinamain)" \
    '[ "$(count_matches "^export interface LoginTransformed")" -eq 0 ]'
assert_true "LogoutTransformed TIDAK ada (POST route, sengaja ga dinamain)" \
    '[ "$(count_matches "^export interface LogoutTransformed")" -eq 0 ]'
echo ""

echo "=================================================================="
echo " Bug #6: Double-enrichment -> field kadang salah tergantung urutan call"
echo "=================================================================="
# Jalanin generate-v2 dua kali, hasilnya harus identik (deterministic).
# Kalau enrich() ga idempotent, dua run bisa beda karena state/order-dependent bug.
OUTDIR2="$(mktemp -d)"
node dist/cli.js generate-v2 -m "$MANIFEST" -o "$OUTDIR2" > /tmp/generate-v2-run2.log 2>&1
assert_true "Dua kali generate-v2 hasilnya identik (deterministic, ga double-enrich)" \
    'diff -q "$API_READ" "$OUTDIR2/types/api-read.ts" > /dev/null 2>&1'
rm -rf "$OUTDIR2"
echo ""

echo "=================================================================="
echo " Bug #7+#8+#9+#10: Model vs Resource collision (Order, Payment, Register)"
echo "=================================================================="
body="$(interface_body OrderTransformed)"
assert_true "OrderTransformed punya kolom DB asli (id, userId, totalHarga, status)" \
    'echo "$body" | grep -q "readonly id: number" && echo "$body" | grep -q "readonly userId: number" && echo "$body" | grep -q "readonly totalHarga: number" && echo "$body" | grep -q "readonly status: string"'
assert_true "OrderTransformed TIDAK ke-polusi field checkout/cart (produkItemId, shippingNama)" \
    '! echo "$body" | grep -q "produkItemId\|shippingNama"'

body="$(interface_body PaymentTransformed)"
assert_true "PaymentTransformed punya kolom DB asli (id, orderId, paidAt)" \
    'echo "$body" | grep -q "readonly id: number" && echo "$body" | grep -q "readonly orderId: number" && echo "$body" | grep -q "readonly paidAt: string | null"'
assert_true "PaymentTransformed TIDAK ke-polusi field gateway (idempotencyKey, gatewayCode)" \
    '! echo "$body" | grep -q "idempotencyKey\|gatewayCode"'

body="$(interface_body ProdukItemTransformed)"
assert_true "ProdukItemTransformed punya kolom DB asli (id, harga, stok)" \
    'echo "$body" | grep -q "readonly id: number" && echo "$body" | grep -q "readonly harga: number" && echo "$body" | grep -q "readonly stok: number"'

assert_true "RegisterTransformed TIDAK ada (duplikat palsu dari inferModels)" \
    '[ "$(count_matches "^export interface RegisterTransformed ")" -eq 0 ] && [ "$(count_matches "^export interface RegisterTransformed$")" -eq 0 ]'
assert_true "RegisterResponseTransformed ada (yang asli, dari Resource class)" \
    '[ "$(count_matches "^export interface RegisterResponseTransformed")" -eq 1 ]'
echo ""

echo "=================================================================="
echo " Final: total interface count harus 29 (match ground truth)"
echo "=================================================================="
TOTAL=$(grep -c "^export interface" "$API_READ")
assert_true "Total interface = 29 (dapat: $TOTAL)" '[ "$TOTAL" -eq 29 ]'
echo ""

echo "=================================================================="
printf " HASIL: "
if [ "$FAIL" -eq 0 ]; then
    green "$PASS PASS, $FAIL FAIL — semua fix ke-verifikasi jalan bareng"
else
    red "$PASS PASS, $FAIL FAIL — ada regresi, cek detail di atas"
fi
echo "=================================================================="

rm -rf "$OUTDIR"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
