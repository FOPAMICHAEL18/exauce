import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StatCard from './StatCard'

describe('StatCard Component', () => {
  it('rend le nom et la valeur numérique de la statistique avec le style par défaut', () => {
    render(<StatCard statName="PRODUITS" statValue={42} />)

    expect(screen.getByText('PRODUITS')).toBeDefined()
    
    const valueElement = screen.getByText('42')
    expect(valueElement).toBeDefined()
    expect(valueElement.className).toBe('text-3xl font-bold mt-2 text-gray-800')
  })

  it('rend la valeur textuelle de la statistique', () => {
    render(<StatCard statName="VENTES" statValue="1 500 FCFA" />)

    expect(screen.getByText('VENTES')).toBeDefined()
    expect(screen.getByText('1 500 FCFA')).toBeDefined()
  })

  it('applique la classe spécifique text-orange-500 pour "AVIS MASQUES"', () => {
    render(<StatCard statName="AVIS MASQUES" statValue={5} />)

    expect(screen.getByText('AVIS MASQUES')).toBeDefined()

    const valueElement = screen.getByText('5')
    expect(valueElement.className).toBe('text-3xl font-bold mt-2 text-orange-500')
  })
})