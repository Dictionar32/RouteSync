# Phase 651 — AST/Upstream Literal Relational Frontier

## Scope

This phase continues the semantic-authority cutover after Phase 650.

The active frontier was `resourceAstExpressionMapper.ts`, specifically literal
resolution at the PHP-AST → domain semantic boundary.

## Change

Literal resolution no longer narrows the PHP literal through direct host-language
casts. The mapping now follows a relational option pipeline:

```text
PHP literal evidence
  ↓
relationFirstOption(number)
  ↓
relationFirstOption(boolean)
  ↓
relationFirstOption(string)
  ↓
canonical semantic literal + semantic primitive witness
```

The PHP `null` literal remains source evidence. It is not treated as a TypeScript
absence sentinel.

## Architectural intent

The semantic decision is represented by relation witnesses rather than a chain of
host-language conditional branches. This keeps source vocabulary separate from
semantic execution authority and makes the literal boundary compatible with the
existing relation solver / rewrite architecture.

This direction is consistent with declarative compiler systems in which rewrite
patterns are separated from their execution engine and repeatedly applied toward a
fixed point, and with circular/reference attribute systems that express recursive
semantic dependencies as equations evaluated to a fixed point.

## Unused-file vacuum

A conservative production-reference audit was run before modification.
No additional non-empty production TypeScript file was sufficiently proven dead.
No file was deleted and no uncertain file was vacuumed.

## Validation

The touched TypeScript sources were syntax-transpiled successfully with the
installed TypeScript compiler.

Repository-wide `tsc --noEmit` remains environment-blocked because the workspace
currently lacks the `node` and `vitest/globals` type-definition packages required
by the root configuration. This is an environment diagnostic, not a syntax
failure in the touched files.

## Vocabulary audit

The touched production files contain no host implementation occurrences of:

- `if`
- `while`
- `for`
- `switch`
- `.map()`
- `.filter()`
- `.reduce()`
- `.flatMap()`
- `undefined`
- `??`
- `===`
- `as unknown`
- `Set`
- `any`
- `new`

PHP source constructs such as `if`, `for`, `null`, `??`, and other PHP syntax
vocabulary remain where they are explicitly represented as upstream source facts.
They are not removed mechanically because doing so would erase source evidence.
