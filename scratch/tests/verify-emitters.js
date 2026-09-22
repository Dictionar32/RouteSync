"use strict";
/**
 * Standalone verification script untuk emitters
 * Compile: npx tsc verify-emitters.ts --target es2020 --module esnext
 * Run: node --input-type=module <(npx tsc -p . --noEmit && npx tsx verify-emitters.ts)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const url_1 = require("url");
const ContractEmitter_1 = require("./packages/cli/src/generators/layers/ContractEmitter");
const ReadEmitter_1 = require("./packages/cli/src/generators/layers/ReadEmitter");
const SchemaEmitter_1 = require("./packages/cli/src/generators/layers/SchemaEmitter");
const FieldEmitter_1 = require("./packages/cli/src/generators/layers/FieldEmitter");
const MapperEmitter_1 = require("./packages/cli/src/generators/layers/MapperEmitter");
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
async function verify() {
    console.log('🧪 Verifying Phase 2 Emitters...\n');
    // Load manifest
    console.log('📋 Loading manifest dari frontend...');
    const manifestPath = path_1.default.join(__dirname, 'routesync.manifest.json');
    let manifest;
    try {
        const content = await fs_extra_1.default.readFile(manifestPath, 'utf-8');
        manifest = JSON.parse(content);
        console.log(`✅ Manifest loaded: ${manifest.routes?.length} routes\n`);
    }
    catch (e) {
        console.error('❌ Failed to load manifest:', e.message);
        process.exit(1);
    }
    // Create temp directory
    const tmpDir = path_1.default.join('/tmp', `routesync-verify-${Date.now()}`);
    await fs_extra_1.default.ensureDir(tmpDir);
    // Create context
    const context = {
        manifest,
        knownModels: new Set(),
        knownResources: new Set(),
        knownSchemas: new Set(),
        kernel: undefined,
    };
    try {
        // Test 1: ContractEmitter
        console.log('1️⃣  Testing ContractEmitter...');
        const contractResult = await ContractEmitter_1.ContractEmitter.generate(path_1.default.join(tmpDir, 'contract'), context);
        const contractContent = contractResult.output.lines.join('\n');
        console.log(`   ✅ Generated ${contractResult.output.lines.length} lines`);
        console.log(`   ✅ routeResponseMap: ${contractResult.routeResponseMap.size} entries`);
        if (contractContent.includes(' any')) {
            console.error('   ❌ Found `any` type in output');
            throw new Error('ContractEmitter output contains `any` types');
        }
        else {
            console.log('   ✅ No `any` types found');
        }
        // Verify file written
        const contractFile = path_1.default.join(tmpDir, 'contract', 'api-contract.ts');
        if (await fs_extra_1.default.pathExists(contractFile)) {
            console.log(`   ✅ File written: api-contract.ts`);
        }
        // Test 2: ReadEmitter
        console.log('\n2️⃣  Testing ReadEmitter...');
        const readResult = await ReadEmitter_1.ReadEmitter.generate(path_1.default.join(tmpDir, 'types'), context, contractResult.routeResponseMap);
        const readContent = readResult.lines.join('\n');
        console.log(`   ✅ Generated ${readResult.lines.length} lines`);
        if (readContent.includes(' any')) {
            console.error('   ❌ Found `any` type in output');
            throw new Error('ReadEmitter output contains `any` types');
        }
        else {
            console.log('   ✅ No `any` types found');
        }
        const readFile = path_1.default.join(tmpDir, 'types', 'api-read.ts');
        if (await fs_extra_1.default.pathExists(readFile)) {
            console.log(`   ✅ File written: api-read.ts`);
        }
        // Test 3: SchemaEmitter
        console.log('\n3️⃣  Testing SchemaEmitter...');
        const schemaResult = await SchemaEmitter_1.SchemaEmitter.generate(path_1.default.join(tmpDir, 'contract'), context);
        const schemaContent = schemaResult.lines.join('\n');
        console.log(`   ✅ Generated ${schemaResult.lines.length} lines`);
        if (schemaContent.includes(' any')) {
            console.error('   ❌ Found `any` type in output');
            throw new Error('SchemaEmitter output contains `any` types');
        }
        else {
            console.log('   ✅ No `any` types found');
        }
        // Test 4: FieldEmitter
        console.log('\n4️⃣  Testing FieldEmitter...');
        const fieldResult = await FieldEmitter_1.FieldEmitter.generate(path_1.default.join(tmpDir, 'contract'), context);
        const fieldContent = fieldResult.lines.join('\n');
        console.log(`   ✅ Generated ${fieldResult.lines.length} lines`);
        if (fieldContent.includes(' any')) {
            console.error('   ❌ Found `any` type in output');
            throw new Error('FieldEmitter output contains `any` types');
        }
        else {
            console.log('   ✅ No `any` types found');
        }
        // Test 5: MapperEmitter
        console.log('\n5️⃣  Testing MapperEmitter...');
        const mapperResult = await MapperEmitter_1.MapperEmitter.generate(path_1.default.join(tmpDir, 'mappers'), context, contractResult.routeResponseMap);
        const mapperContent = mapperResult.lines.join('\n');
        console.log(`   ✅ Generated ${mapperResult.lines.length} lines`);
        if (mapperContent.includes(' any')) {
            console.error('   ❌ Found `any` type in output');
            throw new Error('MapperEmitter output contains `any` types');
        }
        else {
            console.log('   ✅ No `any` types found');
        }
        // Test 6: IR immutability
        console.log('\n6️⃣  Testing IR pattern immutability...');
        const mapBefore = new Map(contractResult.routeResponseMap);
        await ReadEmitter_1.ReadEmitter.generate(path_1.default.join(tmpDir, 'types-2'), context, contractResult.routeResponseMap);
        await MapperEmitter_1.MapperEmitter.generate(path_1.default.join(tmpDir, 'mappers-2'), context, contractResult.routeResponseMap);
        if (contractResult.routeResponseMap.size === mapBefore.size) {
            console.log('   ✅ routeResponseMap immutable (size unchanged)');
        }
        else {
            throw new Error('routeResponseMap was modified during emitter passes');
        }
        // Final report
        console.log('\n✨ All tests passed!\n');
        console.log('📊 Summary:');
        console.log(`   • ContractEmitter: ${contractResult.output.lines.length} lines`);
        console.log(`   • ReadEmitter: ${readResult.lines.length} lines`);
        console.log(`   • SchemaEmitter: ${schemaResult.lines.length} lines`);
        console.log(`   • FieldEmitter: ${fieldResult.lines.length} lines`);
        console.log(`   • MapperEmitter: ${mapperResult.lines.length} lines`);
        console.log(`   • routeResponseMap entries: ${contractResult.routeResponseMap.size}`);
        console.log(`\n✅ Phase 2 emitters working correctly!\n`);
        // Cleanup
        await fs_extra_1.default.remove(tmpDir);
    }
    catch (e) {
        console.error('\n❌ Verification failed:');
        console.error(e.message);
        await fs_extra_1.default.remove(tmpDir);
        process.exit(1);
    }
}
verify();
