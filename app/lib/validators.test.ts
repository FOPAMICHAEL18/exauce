// app/lib/validators.test.ts

import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateAuthor,
  validateComment,
  validateRating,
  validateProductId,
} from './validators';


describe('validateEmail', () => {
  it('retourne true pour un email valide', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('retourne false pour un email sans @', () => {
    expect(validateEmail('testexample.com')).toBe(false);
  });

  it('retourne false pour un email trop court', () => {
    expect(validateEmail('a@b')).toBe(false);
  });

  it('retourne false pour une chaîne vide', () => {
    expect(validateEmail('')).toBe(false);
  });
});


describe('validateAuthor', () => {
  it('retourne true pour un nom de 2+ caractères', () => {
    expect(validateAuthor('Jean')).toBe(true);
    expect(validateAuthor('AB')).toBe(true);
  });

  it('retourne false pour un nom de 1 caractère', () => {
    expect(validateAuthor('J')).toBe(false);
  });

  it('retourne false pour un nom vide', () => {
    expect(validateAuthor('')).toBe(false);
  });

  it('ignore les espaces au début et à la fin', () => {
    // "  A  ".trim() = "A" → 1 caractère → false
    expect(validateAuthor('  A  ')).toBe(false);
    // "  Jean  ".trim() = "Jean" → 4 caractères → true
    expect(validateAuthor('  Jean  ')).toBe(true);
  });
});


describe('validateComment', () => {
  it('retourne true pour un commentaire de 5+ caractères', () => {
    expect(validateComment('Super')).toBe(true);
    expect(validateComment('Très bon produit')).toBe(true);
  });

  it('retourne false pour un commentaire trop court', () => {
    expect(validateComment('OK')).toBe(false);
    expect(validateComment('')).toBe(false);
  });

  it('ignore les espaces', () => {
    expect(validateComment('  OK  ')).toBe(false);
  });
});


describe('validateRating', () => {
  it('retourne true pour les notes 1 à 5', () => {
    expect(validateRating(1)).toBe(true);
    expect(validateRating(2)).toBe(true);
    expect(validateRating(3)).toBe(true);
    expect(validateRating(4)).toBe(true);
    expect(validateRating(5)).toBe(true);
  });

  it('retourne false pour 0', () => {
    expect(validateRating(0)).toBe(false);
  });

  it('retourne false pour 6', () => {
    expect(validateRating(6)).toBe(false);
  });

  it('retourne false pour un nombre négatif', () => {
    expect(validateRating(-1)).toBe(false);
  });

  it('retourne false pour un nombre décimal', () => {
    expect(validateRating(3.5)).toBe(false);
  });
});


describe('validateProductId', () => {
  it('retourne true pour un ID valide', () => {
    expect(validateProductId(1)).toBe(true);
    expect(validateProductId(42)).toBe(true);
    expect(validateProductId(999)).toBe(true);
  });

  it('retourne false pour 0', () => {
    expect(validateProductId(0)).toBe(false);
  });

  it('retourne false pour un nombre négatif', () => {
    expect(validateProductId(-1)).toBe(false);
  });

  it('retourne false pour un décimal', () => {
    expect(validateProductId(1.5)).toBe(false);
  });
});