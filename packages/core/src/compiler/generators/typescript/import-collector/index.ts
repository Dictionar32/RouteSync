/**
 * Import Collector Subdomain Index.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module compiler/generators/typescript/import-collector
 */

export {
    type ImportSpec,
    type MutableImportSpec,
    freezeImportSpec
} from './importSpec';

export { ImportStorage } from './importStorage';
