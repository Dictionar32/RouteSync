# RouteSync Compatibility Policy

Kebijakan kompatibilitas ini mengatur aturan perubahan versi untuk menjaga stabilitas kontrak semantik antara compiler, IR, plugin, dan generator backend.

---

## 1. Aturan Versi IR (Intermediate Representation)

* **Perubahan Minor (irVersion: 1.x.y)**:
  * Wajib bersifat kompatibel mundur (*backward compatible*).
  * Penambahan properti opsional baru atau Node Kind baru diperbolehkan.
  * Backend generator yang mendukung versi minor sebelumnya harus tetap dapat berjalan tanpa modifikasi kode.
  
* **Perubahan Mayor (irVersion: X.0.0)**:
  * Diizinkan merilis perubahan merusak (*breaking changes*).
  * Penghapusan Node Kind, perubahan format penamaan kunci wajib, atau penyusunan ulang relasi Edge diperbolehkan.
  * Backend generator wajib memperbarui deklarasi kepatuhan versi IR mayor.

---

## 2. Batas Ketergantungan Backend (Backend Dependencies)

* Backend generator **dilarang keras** bergantung pada data internal compiler yang bersifat tidak terdokumentasi (seperti status parse AST mentah).
* Backend generator hanya boleh mengonsumsi data yang diekspos secara publik melalui spesifikasi `routesync.manifest.json`.

---

## 3. Kebijakan Ekstensi Plugin

* Seluruh plugin (baik kustom maupun bawaan) hanya diperkenankan menggunakan **Plugin API** resmi yang disediakan melalui `CompilerContext`.
* Manipulasi graf semantik langsung di luar siklus daur hidup `CompilerPlugin` tidak didukung dan dapat mengalami ketidakcocokan pada pembaruan minor berikutnya.
