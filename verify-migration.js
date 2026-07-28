const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Type Safety Migration...\n');

// Files to check
const filesToCheck = [
    'packages/core/src/ir/ContractIRBuilder.ts',
    'packages/cli/src/generators/layers/ContractEmitter.ts',
    'packages/cli/src/generators/layers/MapperEmitter.ts',
    'packages/core/src/utils/type-guards.ts',
    'packages/core/src/types/ir.ts'
];

let totalScore = 0;
let maxScore = 0;

filesToCheck.forEach(file => {
    console.log(`📄 Checking: ${file}`);

    if (!fs.existsSync(file)) {
        console.log(`   ❌ File not found`);
        return;
    }

    const content = fs.readFileSync(file, 'utf8');
    let fileScore = 0;
    let fileMaxScore = 0;

    // Check 1: No 'as any' (except in comments)
    const asAnyMatches = content.match(/as any(?![^]*?\*\/)/g);
    if (!asAnyMatches || asAnyMatches.length === 0) {
        console.log(`   ✅ No unsafe 'as any' casting`);
        fileScore += 1;
    } else {
        console.log(`   ⚠️  Found ${asAnyMatches.length} 'as any' instances`);
    }
    fileMaxScore += 1;

    // Check 2: Uses type guards (for IR Builder and Emitters)
    if (file.includes('ContractIRBuilder') || file.includes('Emitter')) {
        if (content.includes('isPrimitiveType') || content.includes('isResourceType')) {
            console.log(`   ✅ Uses type guard functions`);
            fileScore += 1;
        } else {
            console.log(`   ❌ Missing type guard functions`);
        }
        fileMaxScore += 1;
    }

    // Check 3: Uses TypeIRUtils (for IR Builder)
    if (file.includes('ContractIRBuilder')) {
        if (content.includes('TypeIRUtils.make')) {
            console.log(`   ✅ Uses TypeIRUtils utilities`);
            fileScore += 1;
        } else {
            console.log(`   ❌ Missing TypeIRUtils usage`);
        }
        fileMaxScore += 1;
    }

    // Check 4: Has proper imports
    if (file.includes('type-guards.ts')) {
        if (content.includes('export function isPrimitiveType')) {
            console.log(`   ✅ Type guards utility exists`);
            fileScore += 1;
        }
        fileMaxScore += 1;
    }

    if (file.includes('ir.ts')) {
        if (content.includes('class TypeIRUtils')) {
            console.log(`   ✅ TypeIRUtils class exists`);
            fileScore += 1;
        }
        fileMaxScore += 1;
    }

    console.log(`   📊 File Score: ${fileScore}/${fileMaxScore}\n`);
    totalScore += fileScore;
    maxScore += fileMaxScore;
});

console.log('='.repeat(50));
console.log(`🎯 OVERALL MIGRATION SCORE: ${totalScore}/${maxScore} (${Math.round(totalScore / maxScore * 100)}%)`);

if (totalScore / maxScore >= 0.9) {
    console.log('🟢 EXCELLENT: Migration highly successful!');
} else if (totalScore / maxScore >= 0.7) {
    console.log('🟡 GOOD: Migration mostly successful');
} else {
    console.log('🔴 NEEDS WORK: Migration incomplete');
}

console.log('='.repeat(50));