import { prisma } from "@/app/lib/prisma";
import AdminContactForm from "@/app/components/admin/AdminContactForm";

const Contact = async () => {
    // On va chercher la première (et unique) entrée de contact dans la base
    // findFirst() retourne le premier enregistrement ou null.
    const contact = await prisma.contact.findFirst();

    // On prépare les données par défaut si la base est vide
    // (cas où le seed n'a pas été exécuté)
    const defaultContact = {
        address: '',
        phone: '',
        email: '',
        hours: '',
        socials: '',
        latitude: null,
        longitude: null,
    };

    // Si contact existe, on le passe au formulaire ; sinon, on passe les valeurs vides
    const initialData = contact || defaultContact;

    return (
        <div className="space-y-6 px-20 py-4">
            <AdminContactForm />
        </div>
    )
}

export default Contact