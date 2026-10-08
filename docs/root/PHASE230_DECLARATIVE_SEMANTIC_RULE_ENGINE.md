# Phase 230 — Declarative Semantic Rule Engine

Phase 230 menaikkan keputusan semantik satu tingkat lagi: bukan hanya hasil keputusan yang menjadi knowledge, tetapi **aturan yang menghasilkan keputusan tersebut juga menjadi data deklaratif**.

## Arsitektur

```text
source / evidence
      ↓
canonical semantic facts
      ↓
declarative semantic rule registry
      ↓
generic rule interpreter
      ↓
typed semantic consequence
      ↓
data-flow / state / memory / interprocedural analysis
```

`if`/`switch` tidak lagi menjadi tempat definisi kebijakan semantik. Registry berisi:

- `id`
- `priority`
- `constraints`
- typed `consequence`

Evaluator hanya menjalankan mekanisme pencocokan aturan. Ia tidak mengetahui arti Laravel, PHP, assignment, alias, atau callable.

## Kebijakan yang dinaikkan

1. assignment operator → memory effect
2. assignment reference → alias/reference semantics
3. data-flow role → callable boundary

## Tentang while/for

Phase ini **tidak menghapus loop mekanis secara dogmatis**. Fixed-point/worklist iteration adalah mekanisme interpreter/solver dan boleh tetap menggunakan loop internal. Yang dipindahkan adalah *pengetahuan tentang apa yang harus terjadi*, bukan sintaks loop itu sendiri.

Dengan demikian targetnya bukan:

```text
hapus semua if/while/switch/for
```

melainkan:

```text
semantic meaning
    ↓
relations + rules + facts + lattices
    ↓
mechanical interpreter/solver
```

`Map`/`Set` tetap hanya derived index.
