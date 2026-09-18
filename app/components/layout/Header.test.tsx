import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Header from './Header'

// Mock de Next/Link et du composant Navlink
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  )
}))

vi.mock('../ui/Navlink', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  )
}))

describe('Header Component', () => {
  beforeEach(() => {
    // Réinitialisation de la position du scroll avant chaque test
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
  })

  it('affiche le logo, les liens de navigation et le bouton mobile', () => {
    render(<Header />)

    expect(screen.getByText('exauce')).toBeInTheDocument()
    expect(screen.getAllByText('Accueil').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Espace vendeur').length).toBeGreaterThan(0)
  })

  it('ouvre et ferme le menu mobile lors du clic sur le bouton toggle', () => {
    render(<Header />)

    const toggleButton = screen.getByRole('button', { name: /toggle menu/i })

    // Ouverture du menu
    fireEvent.click(toggleButton)
    const mobileMenu = toggleButton.closest('header')?.querySelector('.lg\\:hidden.bg-white')
    expect(mobileMenu).toHaveClass('max-h-96')

    // Fermeture du menu
    fireEvent.click(toggleButton)
    expect(mobileMenu).toHaveClass('max-h-0')
  })

  it('masque le header lors du scroll vers le bas (> 50px) et le réaffiche lors du scroll vers le haut', () => {
    render(<Header />)
    const header = screen.getByRole('banner')

    // Scroll vers le bas (de 0 à 100px) -> masque le header
    act(() => {
      window.scrollY = 100
      fireEvent.scroll(window)
    })
    expect(header).toHaveClass('-translate-y-full')

    // Scroll vers le haut (de 100 à 60px) -> réaffiche le header
    act(() => {
      window.scrollY = 60
      fireEvent.scroll(window)
    })
    expect(header).toHaveClass('translate-y-0')
  })

  it('maintient le header visible si scrollY est inférieur à 10px', () => {
    render(<Header />)
    const header = screen.getByRole('banner')

    // Scroll tout en haut (< 10px)
    act(() => {
      window.scrollY = 5
      fireEvent.scroll(window)
    })
    expect(header).toHaveClass('translate-y-0')
  })

  it('force le header à rester visible lors du scroll si le menu mobile est ouvert', () => {
    render(<Header />)
    const header = screen.getByRole('banner')
    const toggleButton = screen.getByRole('button', { name: /toggle menu/i })

    // Ouvrir le menu mobile
    fireEvent.click(toggleButton)

    // Simuler un scroll vers le bas (> 50px)
    act(() => {
      window.scrollY = 150
      fireEvent.scroll(window)
    })

    // Doit rester visible car le menu mobile est ouvert
    expect(header).toHaveClass('translate-y-0')
  })

  it('ne modifie pas la visibilité lors d un scroll vers le bas sous le seuil de 50px', () => {
        render(<Header />)
        const header = screen.getByRole('banner')

        // Scroll vers le bas de 0px à 30px (> lastScrollY mais < 50px)
        act(() => {
            window.scrollY = 30
            fireEvent.scroll(window)
        })

        // Le header doit rester visible (translate-y-0)
        expect(header).toHaveClass('translate-y-0')
    })
})