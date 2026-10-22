const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/attributeProducer.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const checks = [
  ['upstream owns a closed contextuality judgment union', /type LaravelAttributeContextualityJudgment\s*=\s*\| LaravelContextualAttributeDeclarationEvidence\s*\| LaravelAttributeNonContextualDeclarationJudgment/.test(contract)],
  ['negative judgment is closed and retains qualified identity, source, and resolved interface evidence', /interface LaravelAttributeNonContextualDeclarationJudgment[\s\S]*?closed: true;[\s\S]*?qualifiedIdentity: PhpQualifiedClassName;[\s\S]*?source: SourceSpan;[\s\S]*?resolvedInterfaces: readonly LaravelAttributeResolvedInterfaceEvidence\[\]/.test(contract)],
  ['resolved interface evidence retains resolution and source provenance', /interface LaravelAttributeResolvedInterfaceEvidence[\s\S]*?resolution: Extract<PhpClassNameResolution, \{ readonly kind: 'php_class_name_resolved' \}>;[\s\S]*?source: SourceSpan/.test(contract)],
  ['producer no longer accepts an optional contextual boolean', !/contextual\?: boolean/.test(producer) && /contextuality: LaravelAttributeContextualityJudgment/.test(producer)],
  ['AST contextual field is projected from the closed judgment discriminant', /contextual: input\.contextuality\.kind === 'laravel_contextual_attribute_declaration_evidence'/.test(producer)],
  ['unresolved class identity blocks before attribute AST production', /if \(classIdentityResolution\.kind === 'php_class_name_resolution_blocked'\)[\s\S]*?laravel_attribute_file_scan_blocked[\s\S]*?if \(blockers\.length > 0\)[\s\S]*?laravel_attribute_file_scan_blocked[\s\S]*?attributeProducer\.produce/.test(scanner)],
  ['non-contextual judgment only contains resolved interface evidence', /const resolvedInterfaceEvidence:[\s\S]*?resolvedInterfaces\s*\n\s*\.filter\([\s\S]*?candidate\.resolution\.kind === 'php_class_name_resolved'/.test(scanner)],
  ['only complete file scans contribute ASTs and contextual inventory', /const complete = scanned\.filter\([\s\S]*?laravel_attribute_file_scan_complete[\s\S]*?complete\.map\(result => result\.ast\)[\s\S]*?result\.contextuality\.kind === 'laravel_contextual_attribute_declaration_evidence'/.test(scanner)],
  ['pipeline still stops before downstream scans on a blocked attribute judgment', /attributeScan\.kind === 'laravel_attribute_scan_blocked'[\s\S]*?laravel_source_ast_projection_attribute_scan_blocked/.test(pipeline)],
  ['remaining semantic/relations import in attributeProducer is detected as explicit migration debt', /semantic\/relations/.test(producer)],
  ['changed contextuality path introduces no semantic/foundation import', !/semantic\/foundation/.test(contract + producer + scanner)],
  ['changed scanner introduces no TypeScript assertion operator', !/\sas\s+Extract</.test(scanner)],
  ['existing producer assertion operators remain visible as migration debt', /type as Extract<PhpParameterTypeAst/.test(producer) && /as Sequence<T>/.test(producer)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
