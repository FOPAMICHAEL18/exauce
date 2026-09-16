import { unstable_cache } from 'next/cache'
import { prisma } from '@/app/lib/prisma'
import { Contact } from '@prisma/client'

// Type exact basé sur le `select` de Prisma
export type CategoryItem = {
    id: number // ou string selon ton schéma
    name: string
    slug: string
}

export const getCatCont = unstable_cache(async (): Promise<[CategoryItem[], Contact | null]> => {
    try {
        const [categories, contact] = await Promise.all([
            prisma.category.findMany({
                orderBy: { name: 'asc' },
                select: { id: true, name: true, slug: true }
            }), 
            prisma.contact.findFirst()
        ])
        return [categories, contact]
    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error)
        const emptyCategories: CategoryItem[] = []
        return [emptyCategories, null]
    }
},
['categories-contact-cache'],
{ revalidate: 3600 } // Cache d'une heure
)