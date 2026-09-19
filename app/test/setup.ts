// test/setup.ts
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { server } from './mocks/server'
import { resetPrismaMock } from './mocks/prisma'
import '@testing-library/jest-dom/vitest'

expect.extend(matchers)

// =========================================================================
// Mock URL.createObjectURL / revokeObjectURL
// (jsdom ne les implémente pas)
// =========================================================================
let urlCounter = 0
Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  writable: true,
  value: vi.fn(() => `blob:mock-${++urlCounter}`),
})

Object.defineProperty(URL, 'revokeObjectURL', {
  configurable: true,
  writable: true,
  value: vi.fn(),
})

// =========================================================================
// ❌ Plus de vi.mock('@/lib/prisma') ici
// → Le mock Prisma est appliqué PAR FICHIER dans les tests d'API
// =========================================================================

// Démarre MSW avant tous les tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Nettoie après chaque test
afterEach(() => {
  cleanup()
  server.resetHandlers()
  urlCounter = 0
  resetPrismaMock()
  // ⚠️ vi.clearAllMocks() est géré automatiquement par vitest.config.ts
})

// Arrête MSW après tous les tests
afterAll(() => server.close())