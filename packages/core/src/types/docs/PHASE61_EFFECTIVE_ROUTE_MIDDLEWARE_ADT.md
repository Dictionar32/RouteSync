# Phase 61 — Effective Route Middleware ADT

## Tujuan

Menaikkan semantik middleware Laravel ke upstream tanpa memindahkan AST/PHP
attribute parsing ke interface flow.

Laravel 13 menyediakan middleware dari route/group dan controller. Controller
middleware dapat memiliki `only` / `except`, dan `WithoutMiddleware` dapat
menghapus route middleware. Laravel juga menyediakan API `gatherMiddleware()`
untuk mengumpulkan middleware route termasuk middleware controller.

## Perubahan

- `RouteMiddlewareContract` sekarang membawa `scope`:
  - `all`
  - `only(actions)`
  - `except(actions)`
- `RouteMiddlewareFlow` sekarang membawa `exclusions` sebagai fakta semantik.
- `routeMiddlewareResolver` menerima declaration controller yang sudah
  didekode upstream, bukan AST attribute.
- Tidak ada klaim bahwa array contract adalah execution order. Laravel dapat
  melakukan sorting/priority terhadap middleware saat runtime.
- `RouteSemanticFlow` tetap AST-free.

## Jalur

```text
PHP / Laravel source
  -> lexer/parser AST
  -> upstream controller + route semantic resolvers
  -> RouteMiddlewareFlow (scope + exclusions + provenance)
  -> RouteSemanticFlow
  -> dumb interface flow / consumer
```
