import { expect, afterEach, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import {server} from './mocks/server'

expect.extend(matchers)

// Démarre le serveur MSW avant tous les tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Nettoie après chaque test
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Arrête le serveur après tous les tests
afterAll(() => server.close())