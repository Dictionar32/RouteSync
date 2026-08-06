/**
 * Base interface for code templates.
 * Templates define the structure of generated code without concerning formatting.
 */
export interface Template {
    /**
     * Unique identifier for this template (e.g., 'typescript/interface')
     */
    readonly name: string;

    /**
     * Render template with provided data
     * @param data - Template data (variables, properties, etc.)
     * @returns Generated code string (unformatted)
     */
    render(data: Record<string, any>): string;
}

/**
 * Template data for rendering
 */
export interface TemplateData {
    [key: string]: any;
}

/**
 * Template context with additional metadata
 */
export interface TemplateContext {
    readonly data: TemplateData;
    readonly options?: TemplateOptions;
}

/**
 * Options for template rendering
 */
export interface TemplateOptions {
    /**
     * Add comments to generated code
     */
    readonly addComments?: boolean;

    /**
     * Add auto-generated warning header
     */
    readonly addGeneratedHeader?: boolean;

    /**
     * Custom helper functions available in template
     */
    readonly helpers?: Record<string, (...args: any[]) => any>;
}
