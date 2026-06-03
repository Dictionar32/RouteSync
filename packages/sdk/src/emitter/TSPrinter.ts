import { 
  TSFileUnit, 
  ImportStatement, 
  TSInterface, 
  TSFunction, 
  TSConst,
  TSExport
} from '@routesync/core';

export class TSPrinter {
  public static print(fileUnit: TSFileUnit): string {
    const blocks: string[] = [];

    const importsBlock = this.printImports(fileUnit.imports);
    if (importsBlock) blocks.push(importsBlock);

    const constantsBlock = this.printConstants(fileUnit.zodSchemas);
    if (constantsBlock) blocks.push(constantsBlock);

    const interfacesBlock = this.printInterfaces(fileUnit.interfaces);
    if (interfacesBlock) blocks.push(interfacesBlock);

    const functionsBlock = this.printFunctions(fileUnit.functions);
    if (functionsBlock) blocks.push(functionsBlock);

    const exportsBlock = this.printExports(fileUnit.exports);
    if (exportsBlock) blocks.push(exportsBlock);

    return blocks.join('\n\n') + '\n';
  }

  private static printImports(imports: ImportStatement[]): string {
    if (!imports.length) return '';
    return imports.map(imp => {
      const parts = ['import'];
      if (imp.isType) parts.push('type');
      
      const importsList: string[] = [];
      if (imp.default) importsList.push(imp.default);
      if (imp.named && imp.named.length > 0) {
        importsList.push(`{ ${imp.named.join(', ')} }`);
      }
      
      parts.push(importsList.join(', '));
      parts.push(`from '${imp.from}';`);
      return parts.join(' ');
    }).join('\n');
  }

  private static printInterfaces(interfaces: TSInterface[]): string {
    if (!interfaces.length) return '';
    return interfaces.map(iface => {
      const lines = [];
      lines.push(`${iface.isExported ? 'export ' : ''}interface ${iface.name} {`);
      
      for (const field of iface.fields) {
        lines.push(`  ${field.name}${field.optional ? '?' : ''}: ${field.type};`);
      }
      
      lines.push('}');
      return lines.join('\n');
    }).join('\n\n');
  }

  private static printFunctions(functions: TSFunction[]): string {
    if (!functions.length) return '';
    return functions.map(fn => {
      const lines = [];
      const exportKeyword = fn.isExported ? 'export ' : '';
      const asyncKeyword = fn.isAsync ? 'async ' : '';
      
      lines.push(`${exportKeyword}const ${fn.name} = ${asyncKeyword}(${fn.params})${fn.returnType ? `: ${fn.returnType}` : ''} => {`);
      lines.push(...fn.body);
      lines.push('};');
      
      return lines.join('\n');
    }).join('\n\n');
  }

  private static printConstants(constants: TSConst[]): string {
    if (!constants.length) return '';
    return constants.map(c => {
      const lines = [];
      const exportKeyword = c.isExported ? 'export ' : '';
      const typeAnn = c.typeAnnotation ? `: ${c.typeAnnotation}` : '';
      
      if (c.value.length === 1 && c.value[0].startsWith('export type')) {
          // Special case for type aliases passed via TSConst
          return c.value[0];
      }
      
      lines.push(`${exportKeyword}const ${c.name}${typeAnn} = ${c.value[0]}`);
      
      for (let i = 1; i < c.value.length; i++) {
         lines.push(c.value[i] + (i === c.value.length - 1 ? ';' : ''));
      }
      if (c.value.length === 1) {
          lines[0] += ';';
      }
      
      return lines.join('\n');
    }).join('\n\n');
  }

  private static printExports(exports: TSExport[]): string {
    if (!exports || !exports.length) return '';
    const namedExports = exports.filter(e => e.type === 'named').map(e => e.name);
    const defaultExport = exports.find(e => e.type === 'default');

    const lines = [];
    if (namedExports.length > 0) {
      lines.push(`export { ${namedExports.join(', ')} };`);
    }
    if (defaultExport) {
      lines.push(`export default ${defaultExport.name};`);
    }
    return lines.join('\n');
  }
}
