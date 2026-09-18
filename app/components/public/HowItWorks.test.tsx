import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import HowItWorks, { steps } from './HowItWorks'

afterEach(() => {
  cleanup()
})

describe('HowItWorks', () => {
  it('rend la section complète avec ses 3 étapes', () => {
    render(<HowItWorks />)

    // Titre principal de la section (SEO)
    expect(
      screen.getByRole('heading', { level: 2, name: /comment ça marche/i })
    ).toBeInTheDocument()

    // Chaque étape du tableau est rendue avec son titre
    steps.forEach((step) => {
      expect(
        screen.getByRole('heading', { level: 3, name: step.title })
      ).toBeInTheDocument()
    })
  })

  it('expose 3 étapes bien numérotées', () => {
    expect(steps).toHaveLength(3)
    steps.forEach((step, i) => {
      expect(step.stepNumber).toBe(i + 1)
    })
  })
})