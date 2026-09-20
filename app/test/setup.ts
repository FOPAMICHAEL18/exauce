import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { server } from './mocks/server'
import { resetPrismaMock } from './mocks/prisma'
import '@testing-library/jest-dom/vitest'

expect.extend(matchers)

// Mock URL.createObjectURL / revokeObjectURL (non implémentés par jsdom)
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

// Le mock Prisma est appliqué par fichier dans les tests d'API, pas ici.

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
  urlCounter = 0
  resetPrismaMock()
})

afterAll(() => server.close())