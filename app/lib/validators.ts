// Vérifie qu'un email est valide (simple)
const validateEmail = (email: string): boolean => {
  // includes('@') : contient un @
  // length >= 5 : au moins 5 caractères (a@b.c)
  return email.includes('@') && email.length >= 5;
}


// Vérifie qu'un nom fait au moins 2 caractères (après trim)
const validateAuthor = (author: string): boolean => {
  // trim() : supprime les espaces
  // length >= 2 : au moins 2 caractères
  return author.trim().length >= 2;
}


// Vérifie qu'un commentaire fait au moins 5 caractères
const validateComment = (comment: string): boolean => {
  return comment.trim().length >= 5;
}


// Vérifie que la note est un entier entre 1 et 5
const validateRating = (rating: number): boolean => {
  // Number.isInteger() : vérifie que c'est un entier (pas 3.5)
  // rating >= 1 : au moins 1
  // rating <= 5 : au plus 5
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}


// Vérifie qu'un ID est un entier positif
const validateProductId = (id: number): boolean => {
  return Number.isInteger(id) && id >= 1;
}

export {validateEmail, validateAuthor, validateComment, validateRating, validateProductId}