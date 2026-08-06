import type { Template, TemplateData, TemplateOptions } from './Template';

/**
 * Registry and rendering engine for code templates
 */
export interface TemplateRegistry {
    /**
     * Register a template
     */
    register(template: Template): void;

    /**
     * Get registered template by name
     */
    get(name: string): Template | undefined;

    /**
     * Check if template is registered
     */
    has(name: string): boolean;

    /**
     * Get all registered template names
     */
    getNames(): readonly string[];
}

/**
 * Template engine for code generation
 * 
 * Responsibilities:
 * - Register and manage templates
 * - Render templates with data
 * - Provide template helper functions
 * 
 * Does NOT handle:
 * - Code formatting (handled by Formatter)
 * - File writing (handled by Writer)
 */
export class TemplateEngine implements TemplateRegistry {
    private templates = new Map<string, Template>();
    private globalHelpers: Record<string, (...args: any[]) => any> = {};

    constructor() {
        this.registerDefaultHelpers();
    }

    /**
     * Register a template
     */
    public register(template: Template): void {
        if (this.templates.has(template.name)) {
            throw new Error(`Template '${template.name}' is already registered`);
        }
        this.templates.set(template.name, template);
    }

    /**
     * Register multiple templates at once
     */
    public registerMany(templates: Template[]): void {
        for (const template of templates) {
            this.register(template);
        }
    }

    /**
     * Get template by name
     */
    public get(name: string): Template | undefined {
        return this.templates.get(name);
    }

    /**
     * Check if template exists
     */
    public has(name: string): boolean {
        return this.templates.has(name);
    }

    /**
     * Get all template names
     */
    public getNames(): readonly string[] {
        return Array.from(this.templates.keys());
    }

    /**
     * Render template with data
     */
    public render(templateName: string, data: TemplateData, options?: TemplateOptions): string {
        const template = this.templates.get(templateName);
        if (!template) {
            throw new Error(`Template '${templateName}' not found. Available: ${this.getNames().join(', ')}`);
        }

        // Merge global helpers with custom helpers
        const mergedData = {
            ...data,
            ...this.globalHelpers,
            ...(options?.helpers || {})
        };

        return template.render(mergedData);
    }

    /**
     * Register a global helper function
     */
    public registerHelper(name: string, fn: (...args: any[]) => any): void {
        this.globalHelpers[name] = fn;
    }

    /**
     * Register default helper functions
     */
    private registerDefaultHelpers(): void {
        // String helpers
        this.registerHelper('uppercase', (str: string) => str.toUpperCase());
        this.registerHelper('lowercase', (str: string) => str.toLowerCase());
        this.registerHelper('capitalize', (str: string) =>
            str.charAt(0).toUpperCase() + str.slice(1)
        );

        // Case conversion helpers
        this.registerHelper('camelCase', (str: string) => {
            return str.replace(/[-_](.)/g, (_, c) => c.toUpperCase());
        });

        this.registerHelper('pascalCase', (str: string) => {
            const camel = str.replace(/[-_](.)/g, (_, c) => c.toUpperCase());
            return camel.charAt(0).toUpperCase() + camel.slice(1);
        });

        this.registerHelper('snakeCase', (str: string) => {
            return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
        });

        // Array helpers
        this.registerHelper('join', (arr: any[], separator: string = ', ') =>
            arr.join(separator)
        );

        this.registerHelper('map', (arr: any[], fn: (item: any) => any) =>
            arr.map(fn)
        );

        this.registerHelper('filter', (arr: any[], fn: (item: any) => boolean) =>
            arr.filter(fn)
        );
    }
}
