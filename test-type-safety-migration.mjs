#!/usr/bin/env node

/**
 * Type Safety Migration Test
 * 
 * Memverifikasi bahwa migrasi dari 'as any' ke type-safe approach
 * berhasil tanpa merusak functionality existing.
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const PROJECT_ROOT = process.cwd()

// Test configurations
const TEST_CONFIG = {
    // Direktori yang perlu diperiksa
    targetDirs: [
        'packages/core/src',
        'packages/cli/src/generators'
    ],

    // Pattern yang perlu dihindari
    unsafePatterns: [
        /as any(?!\s*\/\*.*MIGRATION.*\*\/)/g,  // as any tanpa migration comment
        /\.kind\)\s*as\s+any/g,                   // .kind) as any
        /\s+any\[\]/g                             // any[]
    ],

    // Pattern yang diharapkan ada
    expectedPatterns: [
        /import.*type-guards/,                     // import type guards
        /TypeIRUtils\./,                          // TypeIR utilities usage
        /isPrimitiveType\(|isResourceType\(|isModelType\(/,  // Type guard usage
    ],

    // Files yang diperbolehkan menggunakan 'as any' dengan alasan tertentu
    allowedUnsafeFiles: [
        'test', 'spec', '.test.', '.spec.',       // Test files
        'migration', 'legacy',                     // Migration files  
    ]
}

class TypeSafetyValidator {
    constructor() {
        this.results = {
            filesScanned: 0,
            unsafeUsages: [],
            expectedPatternsMissing: [],
            improvements: [],
            summary: {}
        }
    }

    /**
     * Main validation method
     */
    validate() {
        console.log('🔍 Starting Type Safety Migration Validation...\n')

        for (const dir of TEST_CONFIG.targetDirs) {
            this.scanDirectory(join(PROJECT_ROOT, dir))
        }

        this.generateReport()
    }

    /**
     * Recursively scan directory for TypeScript files
     */
    scanDirectory(dirPath) {
        try {
            const items = readdirSync(dirPath)

            for (const item of items) {
                const fullPath = join(dirPath, item)
                const stat = statSync(fullPath)

                if (stat.isDirectory()) {
                    this.scanDirectory(fullPath)
                } else if (extname(item) === '.ts' && !item.endsWith('.d.ts')) {
                    this.scanFile(fullPath)
                }
            }
        } catch (error) {
            console.warn(`⚠️  Cannot scan directory: ${dirPath}`)
        }
    }

    /**
     * Scan individual TypeScript file
     */
    scanFile(filePath) {
        try {
            const content = readFileSync(filePath, 'utf8')
            this.results.filesScanned++

            const relativePath = filePath.replace(PROJECT_ROOT, '.')
            console.log(`📄 Scanning: ${relativePath}`)

            // Check for unsafe patterns
            this.checkUnsafePatterns(filePath, content)

            // Check for expected improvements
            this.checkExpectedPatterns(filePath, content)

            // Check for improvements
            this.checkImprovements(filePath, content)

        } catch (error) {
            console.warn(`⚠️  Cannot read file: ${filePath}`)
        }
    }

    /**
     * Check for unsafe type casting patterns
     */
    checkUnsafePatterns(filePath, content) {
        const relativePath = filePath.replace(PROJECT_ROOT, '.')

        // Skip files that are allowed to have unsafe patterns
        if (TEST_CONFIG.allowedUnsafeFiles.some(allowed => relativePath.includes(allowed))) {
            return
        }

        for (const pattern of TEST_CONFIG.unsafePatterns) {
            const matches = [...content.matchAll(pattern)]

            if (matches.length > 0) {
                this.results.unsafeUsages.push({
                    file: relativePath,
                    pattern: pattern.toString(),
                    count: matches.length,
                    matches: matches.map(m => ({
                        text: m[0],
                        line: this.getLineNumber(content, m.index)
                    }))
                })
            }
        }
    }

    /**
     * Check for expected type-safe patterns
     */
    checkExpectedPatterns(filePath, content) {
        const relativePath = filePath.replace(PROJECT_ROOT, '.')

        // Only check certain files for expected patterns
        if (!relativePath.includes('ContractIRBuilder') &&
            !relativePath.includes('ContractEmitter') &&
            !relativePath.includes('MapperEmitter')) {
            return
        }

        const missingPatterns = []

        for (const pattern of TEST_CONFIG.expectedPatterns) {
            if (!pattern.test(content)) {
                missingPatterns.push(pattern.toString())
            }
        }

        if (missingPatterns.length > 0) {
            this.results.expectedPatternsMissing.push({
                file: relativePath,
                missingPatterns
            })
        }
    }

    /**
     * Check for positive improvements
     */
    checkImprovements(filePath, content) {
        const relativePath = filePath.replace(PROJECT_ROOT, '.')

        const improvements = []

        // Check for type guard imports
        if (/import.*type-guards/.test(content)) {
            improvements.push('Uses type-guards utility')
        }

        // Check for TypeIR utilities
        if (/TypeIRUtils\./.test(content)) {
            improvements.push('Uses TypeIRUtils')
        }

        // Check for specific type guards
        const typeGuardCount = (content.match(/is[A-Z]\w*Type\(/g) || []).length
        if (typeGuardCount > 0) {
            improvements.push(`Uses ${typeGuardCount} type guard functions`)
        }

        // Check for safe casting
        if (/safeStringCast|softAssertType|safeCast/.test(content)) {
            improvements.push('Uses safe casting utilities')
        }

        if (improvements.length > 0) {
            this.results.improvements.push({
                file: relativePath,
                improvements
            })
        }
    }

    /**
     * Get line number for a given character index
     */
    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length
    }

    /**
     * Generate validation report
     */
    generateReport() {
        console.log('\n' + '='.repeat(80))
        console.log('📊 TYPE SAFETY MIGRATION VALIDATION REPORT')
        console.log('='.repeat(80))

        // Summary statistics
        console.log('\n📈 SUMMARY STATISTICS:')
        console.log(`📄 Files Scanned: ${this.results.filesScanned}`)
        console.log(`⚠️  Unsafe Usages: ${this.results.unsafeUsages.length}`)
        console.log(`❌ Missing Patterns: ${this.results.expectedPatternsMissing.length}`)
        console.log(`✅ Improvements Found: ${this.results.improvements.length}`)

        // Unsafe usages detail
        if (this.results.unsafeUsages.length > 0) {
            console.log('\n⚠️  UNSAFE TYPE CASTING DETECTED:')
            for (const usage of this.results.unsafeUsages) {
                console.log(`\n📄 ${usage.file}`)
                console.log(`   Pattern: ${usage.pattern}`)
                console.log(`   Count: ${usage.count}`)

                for (const match of usage.matches) {
                    console.log(`   Line ${match.line}: ${match.text}`)
                }
            }
        }

        // Missing patterns
        if (this.results.expectedPatternsMissing.length > 0) {
            console.log('\n❌ EXPECTED PATTERNS MISSING:')
            for (const missing of this.results.expectedPatternsMissing) {
                console.log(`\n📄 ${missing.file}`)
                for (const pattern of missing.missingPatterns) {
                    console.log(`   Missing: ${pattern}`)
                }
            }
        }

        // Improvements found
        if (this.results.improvements.length > 0) {
            console.log('\n✅ TYPE SAFETY IMPROVEMENTS DETECTED:')
            for (const improvement of this.results.improvements) {
                console.log(`\n📄 ${improvement.file}`)
                for (const item of improvement.improvements) {
                    console.log(`   ✅ ${item}`)
                }
            }
        }

        // Overall assessment
        console.log('\n' + '='.repeat(80))
        this.assessOverallStatus()
        console.log('='.repeat(80))
    }

    /**
     * Assess overall migration status
     */
    assessOverallStatus() {
        const totalIssues = this.results.unsafeUsages.length + this.results.expectedPatternsMissing.length
        const totalImprovements = this.results.improvements.length

        console.log('🎯 OVERALL MIGRATION STATUS:')

        if (totalIssues === 0 && totalImprovements > 0) {
            console.log('🟢 EXCELLENT: Migration successful, no issues detected!')
            console.log(`   ✅ ${totalImprovements} files show type safety improvements`)
            console.log('   ✅ Zero unsafe type casting detected')
            console.log('   ✅ All expected patterns present')
        } else if (totalIssues <= 2 && totalImprovements > totalIssues) {
            console.log('🟡 GOOD: Migration mostly successful with minor issues')
            console.log(`   ✅ ${totalImprovements} improvements vs ${totalIssues} issues`)
            console.log('   🔧 Few remaining items to address')
        } else if (totalIssues > 5 || totalImprovements === 0) {
            console.log('🔴 NEEDS WORK: Migration incomplete')
            console.log(`   ⚠️  ${totalIssues} issues detected`)
            console.log(`   📈 ${totalImprovements} improvements found`)
            console.log('   🔧 Significant work remaining')
        } else {
            console.log('🟡 IN PROGRESS: Migration partially complete')
            console.log(`   ⚠️  ${totalIssues} issues remaining`)
            console.log(`   ✅ ${totalImprovements} improvements completed`)
        }

        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:')
        if (totalIssues > 0) {
            console.log('   📝 Address remaining unsafe type casting')
            console.log('   🔧 Add missing type guard patterns')
        }
        if (totalImprovements > 0) {
            console.log('   ✅ Continue current migration approach')
            console.log('   📚 Document successful patterns for reuse')
        }
        console.log('   🧪 Run integration tests to verify functionality')
        console.log('   📊 Monitor performance impact of type guards')
    }
}

// Run validation
const validator = new TypeSafetyValidator()
validator.validate()