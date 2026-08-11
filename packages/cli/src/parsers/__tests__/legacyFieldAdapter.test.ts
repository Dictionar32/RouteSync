import { describe, it, expect } from 'vitest'
// NOTE: legacyFieldAdapter.ts di __archive__ sudah TIDAK punya export aktif
// (semua fungsi di-comment out) sehingga file-nya bukan module — status
// archival diverifikasi lewat pembacaan source di test dokumentasi, bukan
// lewat import.
import { PhpCodeParser } from '../PhpCodeParser'

/**
 * ARSIP — bukan regression test aktif.
 *
 * Tujuan file ini BUKAN untuk menjaga `legacyFieldAdapter.ts` tetap benar,
 * tapi untuk mendokumentasikan (dengan bukti eksekusi nyata) KENAPA file
 * itu di-archive alih-alih dipertahankan atau diimplementasikan lebih
 * jauh:
 *
 * 1. `fieldFromParsedASTNode()` mengasumsikan input `ParsedASTNode` yang
 *    sudah pre-classified oleh parser lama (kind: 'resource' / 'model'
 *    sudah ditentukan duluan).
 * 2. Parser aktif sekarang (`PhpCodeParser.ts`, lihat komentar headernya:
 *    "Phase 2 of the FieldNode migration") sudah TIDAK PERNAH lagi
 *    menghasilkan node dengan kind 'resource'/'model' yang pre-tagged —
 *    keputusan itu sudah sepenuhnya dipindah ke `ResourceGraphResolver`.
 * 3. Akibatnya branch 'resource' dan 'model' di adapter lama menjadi dead
 *    code terhadap output engine yang sekarang berjalan, dan beberapa
 *    field (constructor args pada `new_instance`) hilang dibanding hasil
 *    parser baru.
 *
 * Tidak ada satupun call site nyata untuk 3 fungsi adapter ini di seluruh
 * codebase per saat file ini ditulis (hanya di-re-export dari
 * `packages/core/src/index.ts`, tidak pernah benar-benar dipanggil).
 */
describe('[ARCHIVE] legacyFieldAdapter vs PhpCodeParser (engine baru)', () => {
  describe('new_instance — new PaymentResource($payment)', () => {
    const code = 'new PaymentResource($payment)'

    it('engine baru menangkap constructor args', () => {
      const result = PhpCodeParser.parseExpression(code)
      expect(result).toMatchObject({
        kind: 'new_instance',
        className: 'PaymentResource',
        args: [{ kind: 'variable', name: 'payment' }],
      })
    })

    it('adapter lama sudah dihapus dari module archive (fungsi di-comment out)', () => {
      // fieldFromParsedASTNode() sudah TIDAK di-export lagi dari
      // legacyFieldAdapter.ts — seluruh implementasi di-comment out di
      // __archive__ karena branch 'resource'/'model'-nya dead code terhadap
      // PhpCodeParser yang sekarang berjalan. Test lama memanggil fungsi ini
      // untuk mendokumentasikan data loss args-nya; sekarang fungsi itu tidak
      // ada sama sekali, yang justru jadi bukti archival yang lebih kuat.
      // (Verifikasi via source — file archive bukan module karena tidak punya
      // export aktif, jadi tidak bisa di-import.)
      const fs = require('fs')
      const archiveSource = fs.readFileSync(
        require('path').resolve(
          __dirname,
          '../../../../core/src/types/__archive__/legacyFieldAdapter.ts'
        ),
        'utf-8'
      )
      expect(archiveSource).toMatch(/\/\/ export function fieldFromParsedASTNode/)
      expect(archiveSource).not.toMatch(/^export function fieldFromParsedASTNode/)
    })
  })

  describe('static_method_call vs resolved-resource — PaymentResource::collection($payments)', () => {
    const code = 'PaymentResource::collection($payments)'

    it('engine baru menghasilkan static_method_call MENTAH (belum tahu ini Resource)', () => {
      const result = PhpCodeParser.parseExpression(code)
      expect(result).toMatchObject({
        kind: 'static_method_call',
        className: 'PaymentResource',
        name: 'collection',
      })
      // Klasifikasi "ini Resource atau bukan" sengaja TIDAK terjadi di sini
      // — itu tanggung jawab ResourceGraphResolver, bukan parser.
      expect(result).not.toHaveProperty('resolved')
    })

    it('KESIMPULAN: dua bentuk ini tidak kompatibel satu sama lain', () => {
      const newEngineOutput = PhpCodeParser.parseExpression(code)
      // Branch 'resource' di adapter lama hanya jalan kalau input.kind
      // === 'resource'. Engine baru tidak pernah menghasilkan itu.
      expect(newEngineOutput.kind).not.toBe('resource')
      expect(newEngineOutput.kind).toBe('static_method_call')
      // -> branch 'resource'/'model' di legacyFieldAdapter.ts adalah
      //    dead code terhadap pipeline yang aktif sekarang.
    })
  })

  describe('nested property_access — $payment->order->user->name', () => {
    it('engine baru membangun chain property_access bersarang dengan accessKind deterministik', () => {
      const result = PhpCodeParser.parseExpression('$payment->order->user->name')
      expect(result).toMatchObject({
        kind: 'property_access',
        property: 'name',
        accessKind: 'property_access',
        target: {
          kind: 'property_access',
          property: 'user',
          target: {
            kind: 'property_access',
            property: 'order',
            target: { kind: 'variable', name: 'payment' },
          },
        },
      })
    })
  })
})