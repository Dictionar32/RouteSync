/**
 * importSorter.ts
 *
 * Sorts import statements alphabetically, placing type imports first.
 *
 * @module compiler/formatting/steps
 */

export function sortImports(code: string): string {
    const lines = code.split('\n');
    const imports: string[] = [];
    const rest: string[] = [];
    let inImportBlock = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('import ')) {
            imports.push(line);
            inImportBlock = true;
        } else if (inImportBlock && trimmed === '') {
            rest.push(line);
            inImportBlock = false;
        } else {
            rest.push(line);
        }
    }

    imports.sort((a, b) => {
        const aIsType = a.includes('import type');
        const bIsType = b.includes('import type');
        if (aIsType && !bIsType) return -1;
        if (!aIsType && bIsType) return 1;
        return a.localeCompare(b);
    });

    if (imports.length > 0) {
        return [...imports, '', ...rest].join('\n');
    }

    return rest.join('\n');
}
