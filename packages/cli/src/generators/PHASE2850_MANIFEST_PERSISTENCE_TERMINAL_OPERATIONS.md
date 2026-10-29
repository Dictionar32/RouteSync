# Phase 2850 — Manifest Persistence Terminal Operations

## Runtime trace

`scan/sync -> manifestGeneratorOperations.save -> manifest contract validation -> serialization -> persistence/write -> ManifestPersistenceJudgment.continueWith -> command outcome`.

## Change

The persistence ADT now has four explicit terminal interfaces: complete, contract rejected, serialization rejected, and write rejected. Each terminal is created by its own typed constructor and carries `continueWith`, which dispatches directly to a domain handler. The CLI `scan` and `sync` consumers use this operation rather than switching on the `kind` field.

Serialization and validation helper declarations were converted to typed `const` arrow expressions. Public runtime entry points remain interface-first frozen operation objects. The upstream `collections.ts` file remains empty; no duplicate upstream contract or primitive reasoning label was added.

## Usage

```ts
const persisted = await manifestGeneratorOperations.save(manifest, outputPath);
const canContinue = persisted.continueWith({
  onComplete: () => true,
  onContractRejected: () => false,
  onSerializationRejected: () => false,
  onWriteRejected: () => false,
});
```

This is an example of consuming the runtime ADT; production scan/sync handlers preserve distinct messages and set the process exit code on every rejected terminal.

## Verification boundary

Run `npm run audit:phase2850-manifest-persistence-terminal-operations`. This is a structural audit, not a replacement for TypeScript semantic typechecking, the complete test suite, or an end-to-end CLI run.
