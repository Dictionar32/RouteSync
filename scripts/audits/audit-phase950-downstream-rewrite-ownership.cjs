const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const read = p => fs.readFileSync(p, 'utf8');
const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => { const p=path.join(dir,e.name); return e.isDirectory()?walk(p):[p]; });
const ts = dir => walk(dir).filter(p=>p.endsWith('.ts'));
const rel = p => path.relative(root,p).replaceAll('\\','/');
const imports = (dirs, pattern) => dirs.flatMap(d => ts(d).filter(p=>read(p).includes(pattern)).map(rel));
const scanner = path.join(core,'compiler/scanner');
const downstream = [path.join(core,'compiler/domain'),path.join(core,'compiler/passes'),path.join(core,'compiler/ir'),path.join(core,'ir/domain')];
const foundation = path.join(core,'semantic/foundation');
const forbiddenScannerRewrite = imports(downstream, 'scanner/lexer/routeAst/semanticRewriteEngine');
const forbiddenScannerSubstrate = [
  'scanner/lexer/routeAst/semanticRelationalExecutionPlan',
  'scanner/lexer/routeAst/semanticRelationalAlgebra',
  'scanner/lexer/routeAst/semanticRelationalCollections'
].flatMap(x=>imports(downstream,x));
const foundationForbidden = ['compiler/','scanner/','types/upstream','semantic/kernel'].flatMap(x=>ts(foundation).filter(p=>read(p).includes(x)).map(rel));
const scannerFacades = ['semanticRewriteEngine.ts','semanticRelationalExecutionPlan.ts','semanticRelationalAlgebra.ts','semanticRelationalCollections.ts'].every(f=>fs.existsSync(path.join(core,'compiler/scanner/lexer/routeAst',f)) && read(path.join(core,'compiler/scanner/lexer/routeAst',f)).includes('../../../../semantic/foundation/'));
const foundationModules = ['semanticRewriteEngine.ts','semanticRelationalExecutionPlan.ts','semanticRelationalAlgebra.ts','semanticRelationalCollections.ts'].every(f=>fs.existsSync(path.join(foundation,f)));
const result={foundationModules,foundationForbiddenImports:foundationForbidden,downstreamScannerRewriteImports:forbiddenScannerRewrite,downstreamScannerSubstrateImports:forbiddenScannerSubstrate,scannerFacades,clean:foundationModules&&foundationForbidden.length===0&&forbiddenScannerRewrite.length===0&&forbiddenScannerSubstrate.length===0&&scannerFacades};
console.log(JSON.stringify(result,null,2));
process.exitCode=result.clean?0:1;
