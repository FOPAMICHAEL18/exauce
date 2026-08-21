// import { PrismaClient } from "@prisma/client/edge";
// import { PrismaNeon } from "@prisma/adapter-neon";
// import { Pool, neonConfig } from "@neondatabase/serverless";
// import {faker} from '@faker-js/faker'
// import { create } from "node:domain";
// import ws from "ws";
// import "dotenv/config";


// // Active le polyfill WebSocket pour l'environnement Node.js CLI
// neonConfig.webSocketConstructor = ws;

// // Configuration du pool PG et de l'adaptateur pour Cloudflare / Neon
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// const adapter = new PrismaNeon(pool as any);
// const prisma = new PrismaClient({ adapter })
import dotenv from "dotenv";
dotenv.config({ path: ".dev.vars" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {faker} from '@faker-js/faker'
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Configuration du pool PG et de l'adaptateur pour Cloudflare / Neon
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Fonction permettant de creer de fausses donnees pour la bd
const main = async (): Promise<void> => {
    console.log('🌱 Debut du seeding...')

    //Nettoyage de la base de donnees pour eviter les doublons
    //On les supprime dans un ordre precis a cause des cles etrangeres
    await prisma.review.deleteMany() 
    await prisma.image.deleteMany() 
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()  
    await prisma.contact.deleteMany() 
    await prisma.admin.deleteMany() 
    console.log('🧹 Base nettoye')

    //Creer un compte Admin pour le vendeur
    const admin = await prisma.admin.create({
        data: {
            name: 'admin',
            surname: 'perdu',
            email: 'adminperdu@getMaxListeners.com',
            password: await bcrypt.hash('motDePasse123', 10) //On le remplacera plus tard
        }
    })
    console.log('✅ Admin cree:', admin.email)

    //Creer les categories
    const categoryNames = ['Electronique', 'Maison', 'Vetements', 'Bijoux', 'Livres']
    const categories:{id:number, name:string, slug:string,}[] = []
    for (const name of categoryNames) {
        const slug:string = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-') //Enleve tout les accents et remplace les espaces vides pas les tiret (-)
        const category = await prisma.category.create({
            data: {name, slug}
        })
        categories.push(category)
    }
    console.log(`✅ ${categories.length} categories crees`)

    //cree des produit avec images 
    console.log('📦 Creation des produits')
    for (let index = 0; index < 20; index++) {
        //On choisi une categorie aleatoire
        const randomCategory = categories[Math.floor(Math.random()*categories.length)]   
        
        // On genere un titre
        const title: string = faker.commerce.productName()
        const slug: string = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-').concat('-', faker.string.alphanumeric(4)) //Enleve tout les accents et remplace les espaces vides pas les tiret (-) et on ajoute 4 caracteres aleatoires pour eviter les doublons
        const product = await prisma.product.create({
            data: {
                title: title,
                slug: slug,
                description: faker.commerce.productDescription(),
                price: parseFloat(faker.commerce.price({min: 50, max:10000})),
                stockStatus: faker.helpers.arrayElement(['disponible', 'rupture']),
                categoryId: randomCategory.id,
                image: {
                    create: [
                        {
                            url:`https://picsum.photos/seed/${faker.string.uuid()}/400/400`, // Fausse image
                            altText: `photo de ${title}`,
                            order: 0
                        },
                        {
                            url:`https://picsum.photos/seed/${faker.string.uuid()}/400/400`,
                            altText: `photo secondaire de ${title}`,
                            order: 1
                        },
                    ],
                },
            }
        })

        // Pour chaque produit on cree entre 0 et 3 avis 
        const reviewCount: number = faker.number.int({min: 0, max: 3})
        for (let j: number = 0; j < reviewCount; j++) {
            await prisma.review.create({
                data: {
                    author: faker.person.fullName(),
                    email: faker.internet.email(),
                    rating: faker.number.int({min: 1, max: 5}),
                    comment: faker.lorem.paragraph(),
                    status: faker.helpers.arrayElement(['published','published','published', 'hidden']),
                    productId: product.id,
                }
            })
            
        }
    }
    console.log('✅ 20 produits crees avec leur images et leur avis')

    //Creation des coordinnees de contact
    await prisma.contact.create({
        data: {
            address: 'Makepe misoke',
            phone: '699043872',
            email: 'contact@boutique.com',
            hours: 'Lundi - Vendredi : 10h00 - 17h00\nSamedi : 10h00 - 14h00',
            socials: 'https://www.tiktok.com/maboutique\nhttps://www.facebook.com/maboutique',
            latitude: 48.8710,
            longitude: 2.3318
        }
    })
    console.log('✅ coordonnees de contact crees')

    console.log('Seedind termine avec succes')
}

//Execution et gestion d'erreur
main()
.then(async () => {
    await prisma.$disconnect()
})
.catch(async (error) => {
    //On verifie si c'est une erreur javascript
    if (error instanceof Error) {
        console.log('Erreur lors du seeding:', error.message)
    }
    console.log('Erreur inconnu lors du seeding', error)

    //fermeture de la connection avec Neon
    await prisma.$disconnect()
})

