import { prisma } from "@/app/lib/prisma";
// On importe la fonction 'notFound' de Next.js pour déclencher la page 404
// si le produit demandé n'existe pas.
import { notFound } from 'next/navigation';
import AdminProductForm from "@/app/components/admin/AdminProductForm";

// Dans Next.js 15+, 'params' est une Promise qu'il faut 'await'
const EditProductPage = async ({ params }: { params: Promise<{ id: string }> }) => {
    // On attend la résolution des paramètres d'URL
    const { id } = await params;

    // params.id est une chaîne de caractères (ex: "1").
    // On utilise parseInt() avec la base 10 pour la convertir en nombre entier.
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
        notFound();
    }

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            category: true, // On inclut la catégorie
        },
    });

    if (!product) {
        notFound();
    }

    // On va chercher toutes les catégories, triées par ordre alphabétique,
    // pour les afficher dans le menu déroulant du formulaire.
    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
    });

    // Formatage des données si le prix Prisma est de type Decimal
    const formattedProduct = {
        ...product,
        price: Number(product.price),
    };

    return (
        <div className="space-y-6 px-20 py-4">
            {/* Formulaire d'édition */}
            <AdminProductForm initialData={formattedProduct} categories={categories} />
        </div>
    );
}

export default EditProductPage;