/**
 * TypeScript Printers Subdomain Index.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module compiler/emitters/typescript/printers
 */

export {
    printTypeReference,
    printArrayType,
    printUnionType,
    printIntersectionType,
    printTypeAliasDeclaration
} from './typePrinter';

export {
    printImportDeclaration,
    printExportDeclaration,
    printInterfaceDeclaration,
    printPropertySignature,
    printFunctionDeclaration,
    printMethodSignature,
    printComment
} from './declarationPrinter';
