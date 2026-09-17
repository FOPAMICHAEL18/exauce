import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StepCard from './StepCard'

describe('StepCard Component', () => {
  const mockStep = {
    stepNumber: 1,
    title: 'Créer un compte',
    description: 'Inscrivez-vous en quelques clics pour accéder à l’interface d’administration.',
  }

  it('rend correctement le numéro de l’étape, le titre et la description', () => {
    render(<StepCard step={mockStep} />)

    // Vérification du numéro de l'étape
    expect(screen.getByText('1')).toBeDefined()

    // Vérification du titre
    const titleElement = screen.getByRole('heading', { level: 3, name: 'Créer un compte' })
    expect(titleElement).toBeDefined()

    // Vérification de la description
    expect(
      screen.getByText('Inscrivez-vous en quelques clics pour accéder à l’interface d’administration.')
    ).toBeDefined()
  })
})