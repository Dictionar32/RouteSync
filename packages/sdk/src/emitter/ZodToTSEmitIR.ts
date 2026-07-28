import {
  ZodAST,
  TSEmitModule,
  TSInterface,
  TSInterfaceField,
  TSFunction,
  TSConst,
  ImportStatement,
  GeneratedSDKModule
} from '@routesync/core';

// Type-safe export definitions
export interface TSExportDefinition {
  name: string;
  type: 'interface' | 'function' | 'const' | 'type';
  isDefault?: boolean;
}

export class ZodToTSEmitIR {
  public static convertModules(modules: GeneratedSDKModule[]): TSEmitModule[] {
    // Basic single file mode for now, or multiple modules if we map them
    // Let's create one module per route for Milestone 8C
    return modules.map(m => this.convertModule(m));
  }

  public static convertModule(module: GeneratedSDKModule): TSEmitModule {
    const interfaces: TSInterface[] = [];
    const functions: TSFunction[] = [];
    const constants: TSConst[] = [];
    const exports: TSExportDefinition[] = [];
    const imports: ImportStatement[] = [
      { from: 'zod', named: ['z'] },
      { from: '@routesync/react', named: ['useQuery', 'useMutation'] },
      { from: 'axios', default: 'axios' } // assuming axios for fetcher
    ];

    const pascalRouteName = this.pascalCase(module.routeName);
    const camelRouteName = this.camelCase(module.routeName);

    const responseInterfaceName = `${pascalRouteName}Response`;
    const requestInterfaceName = `${pascalRouteName}Request`;

    // 1. Zod Schema
    const zodLines = this.astToZodCode(module.zod.ast);
    constants.push({
      name: `${camelRouteName}Schema`,
      isExported: true,
      value: zodLines
    });

    const resInterface = this.astToInterface(module.zod.ast, responseInterfaceName);
    if (resInterface) {
      interfaces.push(resInterface);
    } else {
      constants.push({
        name: responseInterfaceName,
        isExported: true,
        value: [`export type ${responseInterfaceName} = z.infer<typeof ${camelRouteName}Schema>;`]
      });
    }

    // 3. Fetcher Function
    const fetcherName = `fetch${pascalRouteName}`;
    const url = this.buildUrl(module.endpoint);
    const method = module.method.toLowerCase();
    const hasBody = module.method !== 'GET' && module.method !== 'DELETE';

    let fetcherParams = '';
    let axiosCall = `  const res = await axios.${method}(${url});`;
    const pathKeys = Object.keys(module.request.params || {});

    if (pathKeys.length > 0) {
      const pathArgs = pathKeys.map(p => `${p}: string | number`).join(', ');
      fetcherParams = hasBody ? `${pathArgs}, data: Record<string, unknown>` : pathArgs;
      if (hasBody) {
        axiosCall = `  const res = await axios.${method}(${url}, data);`;
      }
    } else {
      if (hasBody) {
        fetcherParams = `data: Record<string, unknown>`;
        axiosCall = `  const res = await axios.${method}(${url}, data);`;
      }
    }

    functions.push({
      name: fetcherName,
      type: 'fetcher',
      key: [],
      stableId: `${module.routeName}_fetcher`,
      isExported: true,
      isAsync: true,
      params: fetcherParams,
      returnType: `Promise<${responseInterfaceName}>`,
      body: [
        axiosCall,
        `  return res.data;`
      ]
    });

    // 4. React Query Hook (Disabled for now as requested by user)
    // Hooks removed to prevent name collisions in single file mode

    return {
      routeName: module.routeName,
      files: [
        {
          filePath: `routes/${module.routeName}.ts`,
          imports,
          zodSchemas: constants,
          interfaces,
          functions,
          exports: exports.map(exp => ({
            name: exp.name,
            type: exp.isDefault ? 'default' : 'named'
          }))
        }
      ]
    };
  }

  private static astToZodCode(ast: ZodAST, depth = 0): string[] {
    const indent = '  '.repeat(depth);
    switch (ast.kind) {
      case 'zod_string': return [`z.string()`];
      case 'zod_number': return [`z.number()`];
      case 'zod_boolean': return [`z.boolean()`];
      case 'zod_unknown': return [`z.unknown()`];
      case 'zod_literal': return [`z.literal(${typeof ast.value === 'string' ? '"' + ast.value + '"' : ast.value})`];
      case 'zod_optional':
        const inner = this.astToZodCode(ast.inner, depth)[0];
        return [`${inner}.optional()`];
      case 'zod_array':
        const el = this.astToZodCode(ast.element, depth)[0];
        return [`z.array(${el})`];
      case 'zod_union':
        const opts = ast.options.map(o => this.astToZodCode(o, depth)[0]).join(', ');
        return [`z.union([${opts}])`];
      case 'zod_object':
        const lines: string[] = [];
        lines.push(`z.object({`);
        for (const [key, val] of Object.entries(ast.shape)) {
          const valLines = this.astToZodCode(val, depth + 1);
          if (valLines.length === 1) {
            lines.push(`${indent}  ${key}: ${valLines[0]},`);
          } else {
            lines.push(`${indent}  ${key}: ${valLines[0]}`);
            for (let i = 1; i < valLines.length; i++) {
              lines.push(valLines[i] + (i === valLines.length - 1 ? ',' : ''));
            }
          }
        }
        lines.push(`${indent}})`);
        return lines;
      default:
        return [`z.unknown()`];
    }
  }

  private static astToInterface(ast: ZodAST, name: string): TSInterface | null {
    if (ast.kind === 'zod_object') {
      const fields: TSInterfaceField[] = [];
      for (const [key, val] of Object.entries(ast.shape)) {
        fields.push({
          name: key,
          type: this.getTsType(val),
          optional: val.kind === 'zod_optional'
        });
      }
      return {
        name,
        fields,
        isExported: true
      };
    }
    return null;
  }

  private static getTsType(ast: ZodAST): string {
    switch (ast.kind) {
      case 'zod_string': return 'string';
      case 'zod_number': return 'number';
      case 'zod_boolean': return 'boolean';
      case 'zod_unknown': return 'unknown';
      case 'zod_literal': return typeof ast.value === 'string' ? `"${ast.value}"` : String(ast.value);
      case 'zod_optional': return this.getTsType(ast.inner);
      case 'zod_array': return `${this.getTsType(ast.element)}[]`;
      case 'zod_union': return ast.options.map(o => this.getTsType(o)).join(' | ');
      case 'zod_object': return 'Record<string, unknown>'; // Nested objects - using unknown for safety
      default: return 'unknown';
    }
  }

  private static buildUrl(endpoint: string): string {
    // Replace {id} with ${id}
    if (endpoint.includes('{')) {
      return '\`' + endpoint.replace(/\{([^}]+)\}/g, '${$1}') + '\`';
    }
    return `'${endpoint}'`;
  }

  private static pascalCase(s: string) {
    const words = s.split(/[^a-zA-Z0-9]/).filter(Boolean);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  }

  private static camelCase(s: string) {
    const p = this.pascalCase(s);
    return p.charAt(0).toLowerCase() + p.slice(1);
  }
}
