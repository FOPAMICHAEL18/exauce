import { prisma } from "@/app/lib/prisma";
// On importe la fonction 'notFound' de Next.js pour déclencher la page 404
// si le produit demandé n'existe pas.
import { notFound } from 'next/navigation';
import AdminCategoryForm from "@/app/components/admin/AdminCategoryForm";

// Parse un id de route. Refuse "12abc", "-5", "1.5", "".
function parseRouteId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null
  const n = Number(raw)
  if (!Number.isSafeInteger(n) || n <= 0) return null
  return n
}

// Dans Next.js 15+, 'params' est une Promise qu'il faut 'await'
const EditCategoryPage = async ({ params }: { params: Promise<{ id: string }> }) => {
    // On attend la résolution des paramètres d'URL
    const { id } = await params;

    // params.id est une chaîne de caractères (ex: "1").
    // On utilise parseInt() avec la base 10 pour la convertir en nombre entier.
    const categoryId = parseRouteId(id);

    if (categoryId === null) {
       notFound()
        // notFound() lance une exception Next.js, on n'arrive jamais ici.
        // Ce throw est là pour que TypeScript sache que la branche s'arrête.
        throw new Error('unreachable')
    }

    const category = await prisma.category.findUnique({
        where: { id: categoryId },
    });

    if (!category) {
        notFound()
        throw new Error('unreachable')
    }


    return (
        <div className="space-y-6 px-20 py-40">
            {/* Formulaire d'édition */}
            <AdminCategoryForm initialData={category} />
        </div>
    );
}

export default EditCategoryPage;