import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Phone } from 'lucide-react'
import ContactCard from './ContactCard'

describe('ContactCard Component', () => {
  const defaultProps = {
    title: 'Téléphone',
    subtitle: '+237 699 00 00 00',
    href: 'tel:+237699000000',
    icon: Phone,
  }

  it('rend correctement la carte avec tous ses éléments de base et ses attributs', () => {
    render(<ContactCard {...defaultProps} />)

    // Vérification du lien principal et des attributs de sécurité
    const link = screen.getByRole('link', { name: /téléphone/i })
    expect(link.getAttribute('href')).toBe('tel:+237699000000')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noreferrer')

    // Vérification des textes
    expect(screen.getByText('Téléphone')).toBeDefined()
    expect(screen.getByText('+237 699 00 00 00')).toBeDefined()

    // Vérification que le badge n'est pas affiché par défaut
    expect(screen.queryByText('Disponible')).toBeNull()
  })

  it('affiche le badge lorsque la prop badge est fournie', () => {
    render(<ContactCard {...defaultProps} badge="Disponible 24/7" />)

    const badge = screen.getByText('Disponible 24/7')
    expect(badge).toBeDefined()
    expect(badge.tagName.toLowerCase()).toBe('span')
    expect(badge.className).toContain('text-emerald-600')
  })

  it('gère le sous-titre lorsqu’il vaut null', () => {
    render(<ContactCard {...defaultProps} subtitle={null} />)

    expect(screen.getByText('Téléphone')).toBeDefined()
    const subtitleParagraph = screen.getByText('', { selector: 'p' })
    expect(subtitleParagraph).toBeDefined()
    expect(subtitleParagraph.textContent).toBe('')
  })
})