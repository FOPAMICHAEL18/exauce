import { MapPin, Phone, MessageSquare, Mail } from 'lucide-react'
import Breadcrumb from "@/app/components/ui/Breadcrumb"
import { getCatCont } from "@/app/lib/data"
import ContactCard from '@/app/components/ui/Card/ContactCard'
import ContactForm from '@/app/components/public/ContactForm'
import  ContactMap  from '@/app/components/public/ContactMap'
import ContactHours from '@/app/components/public/ContactHours'

const Contact = async () => {
    const [, contactInfo] = await getCatCont()

    return (
        <div className='bg-white'>
            <Breadcrumb items={[
                    { label: 'Contact'},
                ]} 
            />
            <div className="container mx-auto px-4 space-y-6 py-12">
                <div className="space-y-2">
                    <span className="text-xs font-bold text-[#1B5E38] tracking-wider uppercase">COORDONNÉES</span>
                    <h1 className="text-3xl font-bold text-[#0A1730]">Contactez notre équipe</h1>
                    <p className="text-gray-500 text-sm">
                        Notre showroom et notre équipe commerciale restent à votre disposition pour toute information.
                    </p>
                </div>
                {contactInfo && (
                    <div className='grid grid-cols-1 lg:grid-cols-12 gap-20 items-start'>
                        <div className="lg:col-span-7 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ContactCard 
                                    icon={MapPin} 
                                    title="Adresse boutique" 
                                    subtitle={contactInfo.address} 
                                    href={`https://maps.google.com/?q=${encodeURIComponent(contactInfo.address)}`} 
                                />
                                <ContactCard 
                                    icon={Phone} 
                                    title="Téléphone" 
                                    subtitle={contactInfo.phone} 
                                    badge="Appel direct" 
                                    href={`tel:${contactInfo.phone.replace(/\s+/g, '')}`} 
                                />
                                <ContactCard 
                                    icon={MessageSquare} 
                                    title="WhatsApp" 
                                    subtitle={contactInfo.whatsapp} 
                                    badge="Réponse rapide" 
                                    href={`https://wa.me/${contactInfo.whatsapp?.replace(/[^0-9]/g, '')}`} 
                                />
                                <ContactCard 
                                    icon={Mail} 
                                    title="E-mail" 
                                    subtitle={contactInfo.email} 
                                    href={`mailto:${contactInfo.email}`} 
                                />
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-sm space-y-4">
                                <h2 className="font-bold text-[#0A1730] text-base">Envoyer un message</h2>
                                <ContactForm whatsappNumber={contactInfo.whatsapp} />
                            </div>
                        </div>

                        <div className="lg:col-span-5 space-y-6">
                            <ContactMap latitude={contactInfo.latitude} longitude={contactInfo.longitude} address={contactInfo.address} />
                            <ContactHours hours={contactInfo.hours} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Contact