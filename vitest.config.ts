import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './app/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '.gitignore',
        '.next/',
        '.open-next/',                      // Build OpenNext (si utilisé) : même raison
        'out/',                             // Dossier de build statique : généré
        'dist/',                            // Dossier de build : généré
        'build/',                           // Dossier de build : généré
        '.vinxi/',                          // Dossier de build Vinext : généré
        '.vinext/',
        '.agents/',                         // Dossier interne
        '.git/',                            // Historique Git
        '.vscode/',                         // Config VS Code
        '.idea/',                           // Config IntelliJ
        '*.md',                             // Documentation (README, STRUCT.md...)
        '*.json',                           // JSON de config (package.json, tsconfig.json...)
        'package-lock.json',                // Lock file
        'package.json',
        'skills-lock.json',                 // Lock file custom
        '.wrangler/',
        'prisma/',
        'prisma/migrations/**',             // Fichiers SQL de migration
        'prisma/seed.ts',                   // Script de seed (exécuté une seule fois)
        'dist/',
        '**/*.config.*',                    // next.config.ts, tailwind.config.ts, vitest.config.ts...
        '**/*.config.js',                   // Variantes JS
        '**/*.config.mjs',                  // Variantes MJS
        'postcss.config.mjs',               // Config PostCSS (styles)
        'prisma.config.ts',                 // Config Prisma CLI
        '**/*.d.ts',
        '**/types/**',
        'next-env.d.ts',                    // Généré par Next.js
        'worker-configuration.d.ts',        // Types Cloudflare générés
        '**/layout.tsx',      // Les layouts sont testés en E2E
        '**/loading.tsx',
        '**/not-found.tsx',                 // Page 404 : visuel seulement
        '**/error.tsx',                     // Page d'erreur : visuel seulement
        '**/page.tsx',                      // Pages : testées en E2E
        '**/template.tsx',                  // Templates Next.js (rare)
        '**/default.tsx',                   // Route par défaut Next.js (rare)
        'middleware.ts',                    // Middleware : testé en E2E
        'proxy.ts',                         // Votre "proxy" personnalisé
        '**/not-found.tsx',
        '**/page.tsx',        // Les pages sont testées en E2E
        '.env',                             // Contient des mots de passe : NE JAMAIS commiter ni tester
        '.env.*',                           // .env.local, .env.production...
        '.dev.vars',                        // Variables Wrangler/Cloudflare
        '.dev.vars.*',                      // Variantes
        '**/*.test.ts',                     // Tests unitaires TypeScript
        '**/*.test.tsx',                    // Tests unitaires React
        '**/*.spec.ts',                     // Tests E2E TypeScript
        '**/*.spec.tsx',                    // Tests E2E React
        '**/mocks/**',                      // Fichiers MSW (mock API)
        'e2e/',                             // Dossier Playwright
        'setup.ts',                  // Setup Vitest
        
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
    },
  },
})