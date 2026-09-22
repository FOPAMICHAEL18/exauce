import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './app/test/setup.ts',
    clearMocks: true,     // efface l'historique
    mockReset: true,      // + réinitialise les implémentations
    restoreMocks: true,   // + restaure les spies originaux
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['app/**/*.{ts,tsx}'],
      clean: true,
      reportOnFailure: true,
      exclude: [
        '**/loading.tsx',
        '**/not-found.tsx',
        '**/error.tsx',
        '**/template.tsx',
        '**/default.tsx',
        '**/components/ui/Map.tsx',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/mocks/**',
        'setup.ts',
        '**/*.d.ts',
        '**/types/**',
        'app/generated/**',
        'app/lib/prisma.ts',
        '**/A-propos/**',
        '**/Comment-ca-marche/**',
        'app/layout.tsx',
        '**/layout.tsx',
        '**/Footer.tsx',
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './'),
      'next/navigation': path.resolve(import.meta.dirname, './app/test/mocks/next-navigation.ts'),
      'next/link': path.resolve(import.meta.dirname, './app/test/mocks/next-link.tsx'),
      'next/image': path.resolve(import.meta.dirname, './app/test/mocks/next-image.tsx'),
      'next/server': path.resolve(import.meta.dirname, './app/test/mocks/next-server.ts'),
      'next/headers': path.resolve(import.meta.dirname, './app/test/mocks/next-headers.ts'),
      'server-only': path.resolve(import.meta.dirname, './app/test/mocks/server-only.ts')
    },
  },
})