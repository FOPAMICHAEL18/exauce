// app/components/product/ViewTracker.test.tsx
import { render, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mocks/server'
import ViewTracker from '@/app/components/product/ViewTracker'

const calls: { slug: string }[] = []

beforeEach(() => {
  calls.length = 0
  sessionStorage.clear()
  server.use(
    http.post('*/api/products/:slug/views', ({ params }) => {
      calls.push({ slug: String(params.slug) })
      return HttpResponse.json({ success: true })
    })
  )
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('ViewTracker', () => {
  it('ne rend rien (null)', () => {
    const { container } = render(<ViewTracker slug="chaise-bois" />)
    expect(container.firstChild).toBeNull()
  })

  it('envoie un POST à /api/products/:slug/views au montage', async () => {
    render(<ViewTracker slug="chaise-bois" />)
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].slug).toBe('chaise-bois')
  })

  it("n'envoie rien si le slug est vide", async () => {
    render(<ViewTracker slug="" />)
    await new Promise((r) => setTimeout(r, 50))
    expect(calls).toHaveLength(0)
  })

  it("encode le slug dans l'URL", async () => {
    render(<ViewTracker slug="chaise bois & métal" />)
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].slug).toBe('chaise bois & métal')
  })

  it('passe un AbortSignal à fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    render(<ViewTracker slug="chaise" />)
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))

    const [, options] = fetchSpy.mock.calls[0]
    expect(options?.signal).toBeInstanceOf(AbortSignal)

    fetchSpy.mockRestore()
  })

  it('abort le fetch au démontage', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch')

  const { unmount } = render(<ViewTracker slug="chaise" />)
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))

  // 🎯 On capture LE signal de NOTRE fetch
  const [, options] = fetchSpy.mock.calls[0]
  const signal = options?.signal as AbortSignal

  expect(signal).toBeInstanceOf(AbortSignal)
  expect(signal.aborted).toBe(false)

  unmount()

  // 👇 Vérification directe : le signal du composant est bien aborté
  expect(signal.aborted).toBe(true)

  fetchSpy.mockRestore()
})

  it("ne log pas d'erreur en cas d'AbortError", async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // 🎯 fetch qui ne se résout JAMAIS, mais rejette sur abort
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
    )

    const { unmount } = render(<ViewTracker slug="chaise" />)

    // Attendre que le fetch soit lancé (pas forcément résolu)
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))

    unmount()  // → abort() → la promesse rejette avec DOMException(AbortError)

    // Laisse le microtask traiter le catch
    await new Promise((r) => setTimeout(r, 20))

    expect(errorSpy).not.toHaveBeenCalled()

    errorSpy.mockRestore()
    fetchSpy.mockRestore()
  })

  it('log une erreur si le réseau échoue', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    server.use(http.post('*/api/products/:slug/views', () => HttpResponse.error()))

    render(<ViewTracker slug="chaise" />)

    await waitFor(() => expect(errorSpy).toHaveBeenCalled())
    expect(errorSpy.mock.calls[0][0]).toMatch(/Erreur tracking vue/i)
    errorSpy.mockRestore()
  })

  it('ne re-track pas si le slug ne change pas (re-render)', async () => {
    const { rerender } = render(<ViewTracker slug="chaise" />)
    await waitFor(() => expect(calls).toHaveLength(1))

    rerender(<ViewTracker slug="chaise" />)
    await new Promise((r) => setTimeout(r, 50))
    expect(calls).toHaveLength(1)
  })

  it('ne re-track pas si le slug est déjà dans sessionStorage', async () => {
    sessionStorage.setItem('viewed:chaise', '1')
    render(<ViewTracker slug="chaise" />)
    await new Promise((r) => setTimeout(r, 50))
    expect(calls).toHaveLength(0)
  })

  it('re-track si le slug change', async () => {
    const { rerender } = render(<ViewTracker slug="chaise" />)
    await waitFor(() => expect(calls).toHaveLength(1))

    rerender(<ViewTracker slug="table" />)
    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[1].slug).toBe('table')
  })

  it("ignore silencieusement l'erreur MSW 'already been handled'", async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // 🎯 Force fetch à rejeter avec un Error contenant "already been handled"
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('the request has already been handled'))

    render(<ViewTracker slug="chaise" />)

    await new Promise((r) => setTimeout(r, 50))

    // Aucun log : le composant doit ignorer cette erreur spécifique
    expect(errorSpy).not.toHaveBeenCalled()

    errorSpy.mockRestore()
    fetchSpy.mockRestore()
  })
})