/**
 * Options for code formatting
 */
export interface FormatOptions {
    /**
     * Number of spaces per indentation level
     */
    readonly indentSize: number;

    /**
     * Indentation style
     */
    readonly indentStyle: 'space' | 'tab';

    /**
     * Maximum line length before wrapping
     */
    readonly maxLineLength: number;

    /**
     * Add trailing commas in multiline structures
     */
    readonly addTrailingComma: boolean;

    /**
     * Sort import statements alphabetically
     */
    readonly sortImports: boolean;

    /**
     * Add semicolons at end of statements
     */
    readonly addSemicolons: boolean;

    /**
     * Quote style for strings
     */
    readonly quoteStyle: 'single' | 'double';

    /**
     * Line ending style
     */
    readonly lineEnding: 'lf' | 'crlf';
}

/**
 * Default format options
 */
export const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
    indentSize: 2,
    indentStyle: 'space',
    maxLineLength: 80,
    addTrailingComma: true,
    sortImports: true,
    addSemicolons: true,
    quoteStyle: 'single',
    lineEnding: 'lf'
};

/**
 * Base interface for code formatters
 * 
 * Responsibilities:
 * - Format code for readability
 * - Apply consistent styling
 * - Fix whitespace and indentation
 * 
 * Does NOT handle:
 * - Code structure generation (handled by Template)
 * - Semantic analysis (handled by Analysis)
 */
export interface Formatter {
    /**
     * Format code string
     * @param code - Unformatted code
     * @param options - Formatting options
     * @returns Formatted code
     */
    format(code: string, options: FormatOptions): string;

    /**
     * Format multiple code files
     * @param files - Array of code strings
     * @param options - Formatting options
     * @returns Array of formatted code strings
     */
    formatMany(files: string[], options: FormatOptions): string[];
}

/**
 * Formatting result with metadata
 */
export interface FormatResult {
    /**
     * Formatted code
     */
    readonly code: string;

    /**
     * Number of changes made
     */
    readonly changesCount: number;

    /**
     * Original line count
     */
    readonly originalLines: number;

    /**
     * Formatted line count
     */
    readonly formattedLines: number;
}
