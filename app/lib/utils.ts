// Transforme un titre en "slug" (URL-friendly)
// Ex: "Tapis Persan Rouge" → "tapis-persan-rouge"
const generateSlug = (text: string): string => {
  return text
    // toLowerCase() : passe tout en minuscules
    .toLowerCase()

    // normalize('NFD') : sépare les caractères accentués
    // Ex: "é" devient "e" + accent combiné
    .normalize('NFD')

    // replace(/[\u0300-\u036f]/g, '') : supprime les accents
    // La regex capture les accents (codes Unicode 0300 à 036F)
    .replace(/[\u0300-\u036f]/g, '')

    // replace(/\s+/g, '-') : remplace les espaces par des tirets
    // \s+ = un ou plusieurs espaces
    .replace(/\s+/g, '-')

    // replace(/[^a-z0-9-]/g, '') : supprime tout sauf lettres, chiffres et tirets
    // [^...] = tout sauf
    .replace(/[^a-z0-9-]/g, '')

    // Remplace PLUSIEURS tirets consécutifs par UN SEUL
    .replace(/-+/g, '-')

    // Supprime les tirets en début et fin de chaîne
    .replace(/^-+|-+$/g, '');
}

// Formate un prix en FCFA
// Ex: 240000 → "240000 FCFA"
const formatPrice = (price: number): string => {
  // toFixed(0) : arrondit à l'entier (0 décimales)
  return `${price.toFixed(0)} FCFA`;
}

// Formate une date en français
// Ex: new Date('2026-09-16') → "16 septembre 2026"
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',    // Jour en chiffres (16)
    month: 'long',     // Mois en toutes lettres (septembre)
    year: 'numeric',   // Année en chiffres (2026)
  });
}

// formate les donnees geaographiques
const buildMapSrc = (
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  address: string
): string => {
  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)

  if (hasCoords) {
    return `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
  }

  const trimmedAddress = address.trim()
  if (trimmedAddress.length > 0) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(trimmedAddress)}&z=14&output=embed`
  }

  // 🎯 Fallback ultime : vue monde
  return 'https://maps.google.com/maps?q=0,0&z=2&output=embed'
}

export {generateSlug, formatDate, formatPrice, buildMapSrc}

//Pagination
// app/lib/utils.ts
export const buildPageList = (
  current: number,
  total: number
): (number | '…')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('…')
  pages.push(total)

  return pages
}