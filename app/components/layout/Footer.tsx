import Link from "next/link"
import { prisma } from "@/app/lib/prisma"
import { MapPinHouse, Phone, Mail } from 'lucide-react'


const Footer = async () => {

    const [categories, contactInfo] = await Promise.all([
        prisma.category.findMany({
            orderBy: {
                name: 'asc' , // Trie par ordre alphabetique
            },
            select: { id: true, name: true, slug: true }
        }), 
        prisma.contact.findFirst()
    ]) // On attend que les deux promesses soient résolues

    return (
        <footer className="bg-[#0A1730] pt-12 pb-6 text-white">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-xl font-bold mb-4">exauce</h3>
                        <p className="text-gray-400 text-sm">
                            Transport, export de marchandise de qualite et abordable depuis la chine et la russie.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Navigation</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><Link href="/">Accueil</Link></li>
                            <li><Link href="/catalogue">Catalogue</Link></li>
                            <li><Link href="/comment-ca-marche">Comment ça marche</Link></li>
                            <li><Link href="/avis-clients">Avis clients</Link></li>
                            <li><Link href="/a-propos">À propos</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Categories</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            {categories.map((category) => (
                                <li key={category.id}>
                                    <Link
                                        href={`/Catalogue?categorie=${category.slug}`}
                                    >
                                        {category.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Contact</h4>
                        <ul className="space-y-3 text-gray-400 text-sm">
                            <li className="flex items-center justify-start">
                                <MapPinHouse className="mr-2 mt-1" size={20} />
                                {contactInfo?.address}
                            </li>
                            <li>
                                {/* Quand un utilisateur clique sur un lien tel:, son téléphone (ou ordinateur) ouvre l'application téléphone avec le numéro pré-rempli. */}
                                <a href={`tel:${contactInfo?.phone}`} className="flex items-center justify-start"> 
                                    <Phone className="mr-2" size={20} />
                                    {contactInfo?.phone}
                                </a>
                            </li>
                            <li>
                                {/* Quand un utilisateur clique sur un lien mailto:, son navigateur ouvre le client email par défaut (Gmail, Outlook, Apple Mail, etc.) avec l'adresse pré-remplie dans le champ "Destinataire". */}
                                <a href={`mailto:${contactInfo?.email}`} className="flex items-center justify-start"> 
                                    <Mail className="mr-2" size={20} />
                                    {contactInfo?.email}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className=" border-t border-gray-800 pt-6 mt-8 text-center text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} exauce. Tous droits réservés.
                </div>
            </div>
        </footer>
    )
}

export default Footer