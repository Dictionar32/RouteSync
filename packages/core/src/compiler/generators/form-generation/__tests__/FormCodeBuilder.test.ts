/**
 * FormCodeBuilder.test.ts
 * 
 * Unit tests for FormCodeBuilder - Pure assembly logic
 * Tests complete code building from action blocks
 */

import { describe, test, expect } from 'vitest';
import { FormCodeBuilder } from '../FormCodeBuilder';
import type { GeneratedAction } from '../FormActionGenerator';
import type { RequestType } from '../../../artifacts/RequestTypesArtifact';

describe('FormCodeBuilder', () => {
    const builder = new FormCodeBuilder();

    describe('Basic code building', () => {
        test('should build file with single form type', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Users',
                    formTypeName: 'UsersForm',
                    actions: []
                }
            ];

            const actions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: [
                        '  create: {',
                        '    name: string',
                        '  }'
                    ],
                    fieldCount: 1
                }
            ];

            const actionsByResource = new Map([['Users', actions]]);

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            expect(result.code).toContain('export type UsersForm = {');
            expect(result.code).toContain('  create: {');
            expect(result.code).toContain('    name: string');
            expect(result.formTypeCount).toBe(1);
        });

        test('should build file with multiple form types', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Users',
                    formTypeName: 'UsersForm',
                    actions: []
                },
                {
                    resourceName: 'Products',
                    formTypeName: 'ProductsForm',
                    actions: []
                }
            ];

            const usersActions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: ['  create: {', '    name: string', '  }'],
                    fieldCount: 1
                }
            ];

            const productsActions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: ['  create: {', '    title: string', '  }'],
                    fieldCount: 1
                }
            ];

            const actionsByResource = new Map([
                ['Users', usersActions],
                ['Products', productsActions]
            ]);

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            expect(result.code).toContain('export type UsersForm = {');
            expect(result.code).toContain('export type ProductsForm = {');
            expect(result.formTypeCount).toBe(2);
        });

        test('should build form type with no actions as empty object', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Empty',
                    formTypeName: 'EmptyForm',
                    actions: []
                }
            ];

            const actionsByResource = new Map<string, readonly GeneratedAction[]>();

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            expect(result.code).toContain('export type EmptyForm = {}');
            expect(result.formTypeCount).toBe(1);
        });
    });

    describe('Multiple actions per form', () => {
        test('should build form with create and update actions', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Users',
                    formTypeName: 'UsersForm',
                    actions: []
                }
            ];

            const actions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: [
                        '  create: {',
                        '    name: string',
                        '    email: string',
                        '  }'
                    ],
                    fieldCount: 2
                },
                {
                    name: 'update',
                    lines: [
                        '  update: {',
                        '    name: string',
                        '  }'
                    ],
                    fieldCount: 1
                }
            ];

            const actionsByResource = new Map([['Users', actions]]);

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            expect(result.code).toContain('  create: {');
            expect(result.code).toContain('  update: {');

            // Check separator between actions
            const lines = result.code.split('\n');
            const createIndex = lines.findIndex(l => l.includes('create:'));
            const updateIndex = lines.findIndex(l => l.includes('update:'));

            expect(updateIndex).toBeGreaterThan(createIndex);
        });

        test('should add blank line separator between actions', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Users',
                    formTypeName: 'UsersForm',
                    actions: []
                }
            ];

            const actions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: ['  create: {', '    name: string', '  }'],
                    fieldCount: 1
                },
                {
                    name: 'update',
                    lines: ['  update: {', '    name: string', '  }'],
                    fieldCount: 1
                }
            ];

            const actionsByResource = new Map([['Users', actions]]);

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            const lines = result.code.split('\n');
            const createClosingIndex = lines.findIndex((l, i) =>
                l.trim() === '}' && lines[i - 1].includes('name: string')
            );

            // Next line after create closing should be blank
            expect(lines[createClosingIndex + 1]).toBe('');
        });

        test('should not add separator after last action', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Users',
                    formTypeName: 'UsersForm',
                    actions: []
                }
            ];

            const actions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: ['  create: {', '    name: string', '  }'],
                    fieldCount: 1
                }
            ];

            const actionsByResource = new Map([['Users', actions]]);

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            const lines = result.code.split('\n');
            const lastActionLineIndex = lines.findIndex((l, i) =>
                l.trim() === '}' && lines[i - 1].includes('name: string')
            );

            // Next line should be closing brace of form type
            expect(lines[lastActionLineIndex + 1]).toBe('}');
        });
    });

    describe('File header generation', () => {
        test('should include proper file header', () => {
            const requestTypes: RequestType[] = [];
            const actionsByResource = new Map<string, readonly GeneratedAction[]>();

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            expect(result.code).toContain('/**');
            expect(result.code).toContain('Form type definitions untuk input validation');
            expect(result.code).toContain('Generated by FormGeneratorPass');
            expect(result.code).toContain('Output path: forms/api-form.ts');
            expect(result.code).toContain('Source: manifest.routes[].validation');
            expect(result.code).toContain('*/');
        });

        test('should have blank line after header', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Users',
                    formTypeName: 'UsersForm',
                    actions: []
                }
            ];

            const actions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: ['  create: {', '    name: string', '  }'],
                    fieldCount: 1
                }
            ];

            const actionsByResource = new Map([['Users', actions]]);

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            const lines = result.code.split('\n');
            const headerEndIndex = lines.findIndex(l => l.trim() === '*/');

            expect(lines[headerEndIndex + 1]).toBe('');
        });
    });

    describe('Empty file generation', () => {
        test('should build empty file when no request types', () => {
            const requestTypes: RequestType[] = [];
            const actionsByResource = new Map<string, readonly GeneratedAction[]>();

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            expect(result.code).toContain('/**');
            expect(result.code).toContain('Form type definitions');
            expect(result.formTypeCount).toBe(0);
            expect(result.lineCount).toBeGreaterThan(0);
        });

        test('should use buildEmptyFile method', () => {
            const result = builder.buildEmptyFile();

            expect(result.code).toContain('/**');
            expect(result.code).toContain('Form type definitions');
            expect(result.code).toContain('Note: No validation rules found in manifest');
            expect(result.code).toContain('// No form types generated');
            expect(result.formTypeCount).toBe(0);
        });

        test('empty file should have correct line count', () => {
            const result = builder.buildEmptyFile();

            const expectedLines = [
                '/**',
                ' * Form type definitions',
                ' * Generated by FormGeneratorPass',
                ' * ',
                ' * Note: No validation rules found in manifest',
                ' */',
                '',
                '// No form types generated'
            ];

            expect(result.lineCount).toBe(expectedLines.length);
        });
    });

    describe('Metadata validation', () => {
        test('should return correct lineCount', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Users',
                    formTypeName: 'UsersForm',
                    actions: []
                }
            ];

            const actions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: ['  create: {', '    name: string', '  }'],
                    fieldCount: 1
                }
            ];

            const actionsByResource = new Map([['Users', actions]]);

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            expect(result.lineCount).toBeGreaterThan(10); // Header + type
            expect(result.lineCount).toBe(result.code.split('\n').length);
        });

        test('should return correct formTypeCount', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Users',
                    formTypeName: 'UsersForm',
                    actions: []
                },
                {
                    resourceName: 'Products',
                    formTypeName: 'ProductsForm',
                    actions: []
                },
                {
                    resourceName: 'Orders',
                    formTypeName: 'OrdersForm',
                    actions: []
                }
            ];

            const usersActions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: ['  create: {', '  }'],
                    fieldCount: 0
                }
            ];

            const actionsByResource = new Map([['Users', usersActions]]);

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            expect(result.formTypeCount).toBe(3);
        });

        test('should return 0 formTypeCount for empty file', () => {
            const result = builder.buildEmptyFile();

            expect(result.formTypeCount).toBe(0);
        });
    });

    describe('Real-world scenarios', () => {
        test('should build complete cart items form', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'CartItems',
                    formTypeName: 'CartItemsForm',
                    actions: []
                }
            ];

            const actions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: [
                        '  create: {',
                        '    produkItemId: string',
                        '    qty: number',
                        '  }'
                    ],
                    fieldCount: 2
                },
                {
                    name: 'update',
                    lines: [
                        '  update: {',
                        '    qty: number',
                        '  }'
                    ],
                    fieldCount: 1
                }
            ];

            const actionsByResource = new Map([['CartItems', actions]]);

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            expect(result.code).toContain('export type CartItemsForm = {');
            expect(result.code).toContain('produkItemId: string');
            expect(result.code).toContain('qty: number');
            expect(result.formTypeCount).toBe(1);
            expect(result.code).toMatch(/create:.*update:/s);
        });

        test('should build profile form', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Profile',
                    formTypeName: 'ProfileForm',
                    actions: []
                }
            ];

            const actions: GeneratedAction[] = [
                {
                    name: 'update',
                    lines: [
                        '  update: {',
                        '    email: string',
                        '    name?: string',
                        '  }'
                    ],
                    fieldCount: 2
                }
            ];

            const actionsByResource = new Map([['Profile', actions]]);

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            expect(result.code).toContain('export type ProfileForm = {');
            expect(result.code).toContain('email: string');
            expect(result.code).toContain('name?: string');
        });

        test('should build multiple forms with various actions', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Users',
                    formTypeName: 'UsersForm',
                    actions: []
                },
                {
                    resourceName: 'Products',
                    formTypeName: 'ProductsForm',
                    actions: []
                }
            ];

            const usersActions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: ['  create: {', '    email: string', '  }'],
                    fieldCount: 1
                }
            ];

            const productsActions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: ['  create: {', '    title: string', '  }'],
                    fieldCount: 1
                },
                {
                    name: 'update',
                    lines: ['  update: {', '    title: string', '  }'],
                    fieldCount: 1
                }
            ];

            const actionsByResource = new Map([
                ['Users', usersActions],
                ['Products', productsActions]
            ]);

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            expect(result.code).toContain('UsersForm');
            expect(result.code).toContain('ProductsForm');
            expect(result.formTypeCount).toBe(2);
        });
    });

    describe('Type definition formatting', () => {
        test('should have proper spacing in type definitions', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Users',
                    formTypeName: 'UsersForm',
                    actions: []
                }
            ];

            const actions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: ['  create: {', '    name: string', '  }'],
                    fieldCount: 1
                }
            ];

            const actionsByResource = new Map([['Users', actions]]);

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            const lines = result.code.split('\n');

            // Check export type line format
            const exportLine = lines.find(l => l.includes('export type'));
            expect(exportLine).toMatch(/^export type \w+Form = \{$/);
        });

        test('should have blank line between form types', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Users',
                    formTypeName: 'UsersForm',
                    actions: []
                },
                {
                    resourceName: 'Products',
                    formTypeName: 'ProductsForm',
                    actions: []
                }
            ];

            const usersActions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: ['  create: {', '  }'],
                    fieldCount: 0
                }
            ];

            const productsActions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: ['  create: {', '  }'],
                    fieldCount: 0
                }
            ];

            const actionsByResource = new Map([
                ['Users', usersActions],
                ['Products', productsActions]
            ]);

            const result = builder.buildFormTypes(requestTypes, actionsByResource);

            const lines = result.code.split('\n');

            // Find where UsersForm starts
            const usersFormStartIndex = lines.findIndex(line => line.includes('export type UsersForm'));
            expect(usersFormStartIndex).toBeGreaterThan(-1);

            // Find the form type's closing brace (not the action's closing brace)
            // Strategy: Find the first '}' that is at the start of the line (no indentation)
            // after we've seen the form start
            let usersFormEndIndex = -1;
            for (let i = usersFormStartIndex + 1; i < lines.length; i++) {
                // Look for a closing brace at the start of the line (form type closing brace)
                // This distinguishes it from the indented closing braces of actions
                if (lines[i] === '}') {
                    usersFormEndIndex = i;
                    break;
                }
            }

            expect(usersFormEndIndex).toBeGreaterThan(0);

            // Next line should be blank (separator between form types)
            expect(lines[usersFormEndIndex + 1]).toBe('');
        });
    });

    describe('Pure function characteristics', () => {
        test('should be deterministic', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Users',
                    formTypeName: 'UsersForm',
                    actions: []
                }
            ];

            const actions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: ['  create: {', '    name: string', '  }'],
                    fieldCount: 1
                }
            ];

            const actionsByResource = new Map([['Users', actions]]);

            const result1 = builder.buildFormTypes(requestTypes, actionsByResource);
            const result2 = builder.buildFormTypes(requestTypes, actionsByResource);

            expect(result1.code).toBe(result2.code);
            expect(result1.formTypeCount).toBe(result2.formTypeCount);
            expect(result1.lineCount).toBe(result2.lineCount);
        });

        test('should not mutate input arrays', () => {
            const requestTypes: RequestType[] = [
                {
                    resourceName: 'Users',
                    formTypeName: 'UsersForm',
                    actions: []
                }
            ];

            const actions: GeneratedAction[] = [
                {
                    name: 'create',
                    lines: ['  create: {', '    name: string', '  }'],
                    fieldCount: 1
                }
            ];

            const actionsByResource = new Map([['Users', actions]]);

            const originalRequestTypes = JSON.parse(JSON.stringify(requestTypes));
            const originalActions = JSON.parse(JSON.stringify(actions));

            builder.buildFormTypes(requestTypes, actionsByResource);

            expect(requestTypes).toEqual(originalRequestTypes);
            expect(actions).toEqual(originalActions);
        });
    });
});
