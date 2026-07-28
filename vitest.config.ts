import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: [
            'packages/*/src/**/*.test.ts',
            'packages/*/src/**/*.integration.test.ts',
            'packages/*/tests/**/*.spec.ts',
            'packages/*/tests/**/*.test.ts',
            'tests/**/*.spec.ts'
        ],
        exclude: ['node_modules', 'dist'],
        testTimeout: 30000,
    },
})
