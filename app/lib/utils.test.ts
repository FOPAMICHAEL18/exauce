import { describe, it, expect } from 'vitest'
import { generateSlug, formatPrice, formatDate } from './utils'

//Test de generateSlug
describe('generateSlug', () => {
  // Test 1 : minuscules
  it('convertit le texte en minuscules', () => {
    // Arrange (préparer)
    const input = 'TAPIS';
    // Act (exécuter)
    const result = generateSlug(input);
    // Assert (vérifier)
    expect(result).toBe('tapis');
  })

  // Test 2 : espaces → tirets
  it('remplace les espaces par des tirets', () => {
    expect(generateSlug('Tapis Persan Rouge')).toBe('tapis-persan-rouge');
  })

  // Test 3 : accents supprimés
  it('supprime les accents', () => {
    expect(generateSlug('Ébène')).toBe('ebene');
    expect(generateSlug('Café Crème')).toBe('cafe-creme');
  })

  // Test 4 : caractères spéciaux supprimés
  it('supprime les caractères spéciaux', () => {
    expect(generateSlug('Tapis & Déco!')).toBe('tapis-deco');
    expect(generateSlug('Produit (neuf)')).toBe('produit-neuf');
  })

  // Test 5 : cas complexe
  it('gère les cas complexes', () => {
    expect(generateSlug('  Table  Basse  Ébène  ')).toBe('table-basse-ebene');
  })

  // Test 6 : chaîne vide
  it('retourne une chaîne vide pour une entrée vide', () => {
    expect(generateSlug('')).toBe('');
  })
})

//Test de formatPrice
describe('formatPrice', () => {
  // Test 1 : nombre entier
  it('formate un prix entier', () => {
    expect(formatPrice(240000)).toBe('240000 FCFA');
  })

  // Test 2 : arrondi
  it('arrondit les décimales', () => {
    expect(formatPrice(199.99)).toBe('200 FCFA');
    expect(formatPrice(199.49)).toBe('199 FCFA');
  })

  // Test 3 : zéro
  it('gère le prix zéro', () => {
    expect(formatPrice(0)).toBe('0 FCFA');
  })

  // Test 4 : nombre négatif (cas limite)
  it('gère les nombres négatifs', () => {
    expect(formatPrice(-100)).toBe('-100 FCFA');
  })
})

//Test de formatDate
describe('formatDate', () => {
  // Test 1 : date complète
  it('formate une date en français', () => {
    const date = new Date('2026-09-16');
    const result = formatDate(date);
    
    // On vérifie que le résultat contient "septembre"
    // (le format exact peut varier selon la plateforme)
    expect(result).toContain('septembre');
    expect(result).toContain('2026');
  })

  // Test 2 : autre mois
  it('gère différents mois', () => {
    expect(formatDate(new Date('2026-01-15'))).toContain('janvier');
    expect(formatDate(new Date('2026-12-25'))).toContain('décembre');
  })
})