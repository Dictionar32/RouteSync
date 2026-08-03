# Compiler Analysis

## Pendahuluan

### Apa itu Compiler Analysis?

Folder `compiler/analysis` berisi komponen-komponen untuk melakukan **analisis statis** terhadap program dalam compiler RouteSync. Analysis adalah tahap dalam compiler pipeline yang bertanggung jawab untuk mengumpulkan informasi tentang struktur dan perilaku program tanpa menjalankannya.

Analysis merupakan fondasi untuk optimisasi compiler dan verifikasi kebenaran program. Komponen-komponen dalam folder ini menyediakan berbagai jenis analisis yang digunakan oleh pass-pass optimisasi untuk membuat keputusan transformasi yang aman dan efektif.

### Tujuan Folder `compiler/analysis`

Folder ini menyediakan:

1. **Data Flow Analysis Framework** - Framework generik untuk menganalisis aliran data dalam program
2. **Control Flow Analysis** - Analisis struktur kontrol program (dominance, loops)
3. **SSA Form Construction** - Konstruksi Static Single Assignment form
4. **Symbol Tracking** - Database simbol dan pelacakan referensi
5. **Use-Def Chains** - Pelacakan hubungan antara penggunaan dan definisi variabel
6. **Analysis Management** - Caching dan dependency tracking untuk hasil analisis

### Peran Analysis dalam Pipeline Compiler

Analysis berada di tengah-tengah pipeline compiler RouteSync:

```
Scanner → Parser → Analysis → Optimization → IR Building → Emission
                      ↑           ↓
                      └─── Feedback Loop ───┘
```

