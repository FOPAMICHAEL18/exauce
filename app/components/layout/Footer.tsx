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
                            <li><Link href="/"><span className="flex items-center justify-start hover:text-white transition-colors">Accueil</span></Link></li>
                            <li><Link href="/catalogue"><span className="flex items-center justify-start hover:text-white transition-colors">Catalogue</span></Link></li>
                            <li><Link href="/comment-ca-marche"><span className="flex items-center justify-start hover:text-white transition-colors">Comment ça marche</span></Link></li>
                            <li><Link href="/avis-clients"><span className="flex items-center justify-start hover:text-white transition-colors">Avis clients</span></Link></li>
                            <li><Link href="/a-propos"><span className="flex items-center justify-start hover:text-white transition-colors">À propos</span></Link></li>
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
                                        <span className="hover:text-white transition-colors">{category.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Contact</h4>
                        <ul className="space-y-3 text-gray-400 text-sm">
                            {contactInfo?.address && (
                                <li className="flex items-start justify-start">
                                    <MapPinHouse className="mr-2 mt-0.5 shrink-0 text-[#1B5E38]" size={18} />
                                    <span>{contactInfo.address}</span>
                                </li>
                            )}
                            {contactInfo?.phone && (
                                <li>
                                    <a href={`tel:${contactInfo.phone}`} className="flex items-center justify-start hover:text-white transition-colors"> 
                                        <Phone className="mr-2 shrink-0 text-[#1B5E38] " size={18} />
                                        <span className="hover:text-white">{contactInfo.phone}</span>
                                    </a>
                                </li>
                            )}
                            {contactInfo?.email && (
                                <li>
                                    <a href={`mailto:${contactInfo.email}`} className="flex items-center justify-start hover:text-white transition-colors"> 
                                        <Mail className="mr-2 shrink-0 text-[#1B5E38]" size={18} />
                                        {/* break-all : Coupe le mot n'importe où (idéal pour les liens très longs et emails dans des espaces étroits). */}
                                        <span className="break-all hover:text-white">{contactInfo.email}</span>
                                    </a>
                                </li>
                            )}
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