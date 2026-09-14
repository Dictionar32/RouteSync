import { describe, it, expect, vi } from 'vitest';
import {
    SemanticResourceBinder,
    ModelSymbolTable,
    ScannedResourceDescriptor,
    ParsedModel
} from '@routesync/core';
import { ValidationPass } from '../../cli/src/generators/passes/validationPass';
import type { NormalizedManifest } from '../../cli/src/generators/normalizer';
import type { CompilerContext, Diagnostic } from '../../cli/src/generators/pipeline';

describe('True Eloquent Model Resolution & DTO Warning System', () => {
    const dummyModel: ParsedModel = {
        name: 'Order',
        tableName: 'orders',
        columns: [
            { name: 'id', type: 'integer', nullable: false, isPrimary: true },
            { name: 'total', type: 'decimal', nullable: false, isPrimary: false }
        ],
        relations: [],
        primaryKey: 'id',
        fillable: ['total'],
        hidden: [],
        casts: [],
        dates: [],
        isSynthetic: false,
        sourceFile: '/app/Models/Order.php'
    };

    it('resolves real modelName from ModelSymbolTable for Eloquent-backed resources', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const table = new ModelSymbolTable([dummyModel]);

        const resource = SemanticResourceBinder.bindResource({
            resourceName: 'OrderResource',
            entries: [],
            sourceFile: '/app/Http/Resources/OrderResource.php',
            modelSymbolTable: table
        });

        expect(resource.modelName).toBe('Order');
        expect(resource.baseModel).toBe('Order');
        expect(resource.isSynthetic).toBe(false);
        expect(warnSpy).not.toHaveBeenCalled();

        warnSpy.mockRestore();
    });

    it('emits compiler warning and marks isSynthetic: true with null modelName for unbacked DTO resources', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const table = new ModelSymbolTable([dummyModel]);

        const resource = SemanticResourceBinder.bindResource({
            resourceName: 'ReportSummaryDtoResource',
            entries: [],
            sourceFile: '/app/Http/Resources/ReportSummaryDtoResource.php',
            modelSymbolTable: table
        });

        expect(resource.modelName).toBeNull();
        expect(resource.baseModel).toBeNull();
        expect(resource.isSynthetic).toBe(true);

        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("[RouteSync Compiler Warning] Resource 'ReportSummaryDtoResource' is a DTO without a matching Eloquent model")
        );

        warnSpy.mockRestore();
    });

    it('ScannedResourceDescriptor.create respects explicit null modelName', () => {
        const res = ScannedResourceDescriptor.create({
            name: 'CustomDtoResource',
            fields: [],
            modelName: null
        });

        expect(res.modelName).toBeNull();
        expect(res.baseModel).toBeNull();
        expect(res.isSynthetic).toBe(true);
    });

    it('ValidationPass reports warning diagnostic for unbacked DTO resources', () => {
        const diagnostics: Diagnostic[] = [];
        const context: CompilerContext = {
            reportDiagnostic: (d) => {
                diagnostics.push(d);
            }
        };

        const pass = new ValidationPass();
        const manifest: NormalizedManifest = {
            routes: [],
            models: [dummyModel],
            resources: [
                {
                    name: 'ReportSummaryDtoResource',
                    baseName: 'ReportSummaryDto',
                    typeName: 'ReportSummaryDtoResourceTransformed',
                    sanitizedName: 'reportSummaryDtoResource',
                    baseModel: null,
                    modelName: null,
                    actions: [],
                    endpoints: [],
                    fields: [],
                    assignments: [],
                    sourceFile: '/app/Http/Resources/ReportSummaryDtoResource.php',
                    sourceLine: 1,
                    isSynthetic: true
                }
            ],
            requests: [],
            config: {}
        };

        pass.run(manifest, context);

        const dtoDiag = diagnostics.find(d => d.message.includes('ReportSummaryDtoResource'));
        expect(dtoDiag).toBeDefined();
        expect(dtoDiag?.severity).toBe('warning');
        expect(dtoDiag?.message).toContain('is a DTO without a matching Eloquent model');
    });
});
