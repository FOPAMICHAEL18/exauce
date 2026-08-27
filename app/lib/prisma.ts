//Ce que ça fait : Importe le client Prisma optimisé pour les environnements Serverless / Edge (comme Cloudflare Workers ou Vercel Edge).
import { PrismaClient } from "@prisma/client/edge";//edge doit etre ajouter pour que prisma puisse s'adapter a next 
//Ce que ça fait : Importe l'adaptateur Prisma qui permet d'utiliser le driver de base de données PostgreSQL JS natif (pg) à la place du moteur Rust binaire standard de Prisma.
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";


//Ce que ça fait : Récupère l'objet global du serveur (globalThis en JS) et le cast en TypeScript pour lui faire comprendre qu'il peut contenir une propriété prisma (qui est soit déjà configurée avec une instance de PrismaClient, soit undefined). C'est l'astuce pour persister l'instance entre les rechargements de Next.js en mode développement.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL est manquant dans les variables d'environnement");
}

// Utilisation du client HTTP stateless (100% compatible Edge/Cloudflare sans promesses croisées)
const sql = neon(process.env.DATABASE_URL);
// On passe le 2ème argument 'options' requis (objet vide pour le schéma 'public' par défaut)
// PrismaNeonHttp prend la string URL en 1er argument et un objet de config (vide) en 2nd argument
const adapter = new PrismaNeonHttp(process.env.DATABASE_URL, {});


// Réutilisation de l'instance si elle existe déjà dans le serveur Next.js
//Si globalForPrisma.prisma existe déjà (connexion préexistante), on la réutilise.
//Si elle n'existe pas encore (undefined), on instancie un nouveau PrismaClient avec notre adaptateur.
//export permet d'importer prisma n'importe où dans le projet.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ 
    adapter,
    log: ["query", "info", "warn", "error"], // 👈 Affiche les logs détaillés dans le terminal 
});

//Ce que ça fait : En mode de développement (lorsque Next.js recharge le code à chaque sauvegarde de fichier), cette ligne enregistre l'instance prisma dans globalThis. Sans cette ligne, chaque Hot Reload recréerait un nouveau pool et épuiserait toutes les connexions de ta BDD.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;