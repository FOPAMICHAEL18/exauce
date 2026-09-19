import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import {server} from './mocks/server'
import '@testing-library/jest-dom/vitest'

expect.extend(matchers)

// On mock `createObjectURL` : retourne une URL unique pour chaque fichier
let urlCounter = 0
Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  writable: true,
  value: vi.fn(() => {
    urlCounter += 1
    return `blob:mock-${urlCounter}`
  }),
})

// On mock `revokeObjectURL` : no-op en test (le navigateur libère la mémoire,
// jsdom n'en a pas besoin)
Object.defineProperty(URL, 'revokeObjectURL', {
  configurable: true,
  writable: true,
  value: vi.fn(),
})

// Démarre le serveur MSW avant tous les tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Nettoie après chaque test
afterEach(() => {
  cleanup()
  server.resetHandlers()
  // 🎯 RESET le compteur pour que chaque test reparte de 1
  urlCounter = 0
})

// Arrête le serveur après tous les tests
afterAll(() => server.close())