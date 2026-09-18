import { describe, it, expect } from 'vitest'
import { generateSlug, formatPrice, formatDate, buildMapSrc } from './utils'

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

//test de buildMapSrc
describe('buildMapSrc', () => {
  // ===== Avec coordonnées =====
  it('utilise les coordonnées quand les deux sont fournies', () => {
    const url = buildMapSrc(4.0483, 9.7043, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=4.0483,9.7043&z=15&output=embed')
  })

  it('utilise les coordonnées même quand latitude = 0', () => {
    // 🎯 Bug classique : 0 est falsy, on doit quand même utiliser les coordonnées
    const url = buildMapSrc(0, 9.7043, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=0,9.7043&z=15&output=embed')
  })

  it('utilise les coordonnées même quand longitude = 0', () => {
    const url = buildMapSrc(4.0483, 0, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=4.0483,0&z=15&output=embed')
  })

  it('utilise les coordonnées même quand les deux valent 0', () => {
    const url = buildMapSrc(0, 0, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=0,0&z=15&output=embed')
  })

  it('accepte des coordonnées négatives', () => {
    const url = buildMapSrc(-33.8688, 151.2093, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=-33.8688,151.2093&z=15&output=embed')
  })

  // ===== Fallback adresse =====
  it("utilise l'adresse quand latitude est null", () => {
    const url = buildMapSrc(null, 9.7043, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=Rue%20Test&z=14&output=embed')
  })

  it("utilise l'adresse quand longitude est null", () => {
    const url = buildMapSrc(4.0483, null, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=Rue%20Test&z=14&output=embed')
  })

  it("utilise l'adresse quand les deux sont undefined", () => {
    const url = buildMapSrc(undefined, undefined, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=Rue%20Test&z=14&output=embed')
  })

  it("encode l'adresse avec caractères spéciaux", () => {
    const url = buildMapSrc(null, null, "Rue de l'Église & Cie, Douala")
    expect(url).toContain(encodeURIComponent("Rue de l'Église & Cie, Douala"))
    expect(url).not.toContain(' ')
  })

  it("trim l'adresse avant encodage", () => {
    const url = buildMapSrc(null, null, '   Rue Test   ')
    expect(url).toBe('https://maps.google.com/maps?q=Rue%20Test&z=14&output=embed')
  })

  // ===== Fallback ultime =====
  it('fallback sur (0,0) si adresse vide', () => {
    const url = buildMapSrc(null, null, '')
    expect(url).toBe('https://maps.google.com/maps?q=0,0&z=2&output=embed')
  })

  it('fallback sur (0,0) si adresse ne contient que des espaces', () => {
    const url = buildMapSrc(null, null, '   \n   ')
    expect(url).toBe('https://maps.google.com/maps?q=0,0&z=2&output=embed')
  })

  // ===== Rejets =====
  it('rejette NaN comme coordonnée', () => {
    const url = buildMapSrc(NaN, 9.7043, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=Rue%20Test&z=14&output=embed')
  })

  it('rejette Infinity comme coordonnée', () => {
    const url = buildMapSrc(Infinity, 9.7043, 'Rue Test')
    expect(url).toBe('https://maps.google.com/maps?q=Rue%20Test&z=14&output=embed')
  })
})