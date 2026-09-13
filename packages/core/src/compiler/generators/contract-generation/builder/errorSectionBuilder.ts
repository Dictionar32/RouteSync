/**
 * errorSectionBuilder.ts
 *
 * Appends canonical Laravel error schemas and validators (CDA SSOT).
 *
 * @module compiler/generators/contract-generation/builder/errorSectionBuilder
 */

export function buildErrorSection(lines: string[]): void {
    lines.push('// ========== ERROR SCHEMAS & VALIDATORS ==========');
    lines.push('export const laravelValidationErrorSchema = z.object({');
    lines.push('  message: z.string(),');
    lines.push('  errors: z.record(z.string(), z.array(z.string()))');
    lines.push('});');
    lines.push('export type LaravelValidationError = z.infer<typeof laravelValidationErrorSchema>;');
    lines.push('export const validateLaravelValidationError = (data: unknown): LaravelValidationError => laravelValidationErrorSchema.parse(data);');
    lines.push('');
    lines.push('export const laravelUnauthorizedErrorSchema = z.object({');
    lines.push('  message: z.string()');
    lines.push('});');
    lines.push('export type LaravelUnauthorizedError = z.infer<typeof laravelUnauthorizedErrorSchema>;');
    lines.push('export const validateLaravelUnauthorizedError = (data: unknown): LaravelUnauthorizedError => laravelUnauthorizedErrorSchema.parse(data);');
    lines.push('');
}
