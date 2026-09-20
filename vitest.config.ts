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
        // Next.js triviaux DANS app/
        '**/loading.tsx',
        '**/not-found.tsx',
        '**/error.tsx',
        '**/template.tsx',
        '**/default.tsx',

        // Composant tiers DANS app/
        '**/components/ui/Map.tsx',

        // Tests DANS app/
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',

        // Infra test DANS app/test/
        '**/mocks/**',
        'setup.ts',

        // Types DANS app/ (au cas où)
        '**/*.d.ts',
        '**/types/**',

        // Code généré (Prisma)
        'app/generated/**',

        // Client Prisma (initialisation singleton)
        'app/lib/prisma.ts',

        // Pages statiques (aucune logique métier)
        'app/(public)/A-propos/**',
        'app/(public)/Comment-ca-marche/**',
        'app/layout.tsx',
        'app/(admin)/layout.tsx',
        'app/(public)/layout.tsx',
        'app/components/layout/Footer.tsx',
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
      'next/server': path.resolve(import.meta.dirname, './app/test/mocks/next-server.ts')
    },
  },
})