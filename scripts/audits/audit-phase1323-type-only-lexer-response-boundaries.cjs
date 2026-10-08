const fs = require('node:fs');
const checks = [];
function check(name, condition) { checks.push({ name, pass: Boolean(condition) }); }
const response = fs.readFileSync('packages/core/src/client/Response.ts', 'utf8');
const lexerIndex = fs.readFileSync('packages/core/src/compiler/scanner/lexer/index.ts', 'utf8');
const sourceLexer = fs.readFileSync('packages/core/src/compiler/scanner/LaravelSourceLexer.ts', 'utf8');
check('ApiResponse is imported type-only', /import\s+type\s+\{\s*ApiResponse\s*\}\s+from\s+['"]\.\.\/types\/response['"]/.test(response));
check('TokenType is exported type-only from lexer barrel', /export\s*\{[\s\S]*?type\s+TokenType[\s\S]*?\}\s*from\s*["']\.\/PhpAst["']/.test(lexerIndex));
check('LaravelSourceLexer imports token and AST contracts type-only', /import\s+type\s+\{[^}]*TokenType[^}]*TokenDescriptor[^}]*SourceStream[^}]*\}\s+from\s+["']\.\/lexer["']/.test(sourceLexer));
check('LaravelSourceLexer retains runtime imports for factories and functions', /import\s*\{[\s\S]*?createSourceOffset[\s\S]*?\}\s*from\s*["']\.\/lexer["']/.test(sourceLexer));
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}`);
const failed = checks.filter(c => !c.pass).length;
console.log(`RESULT ${checks.length - failed}/${checks.length} passed; ${failed} failed`);
if (failed) process.exitCode = 1;
