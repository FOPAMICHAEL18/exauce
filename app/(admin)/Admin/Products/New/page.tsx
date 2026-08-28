import { prisma } from "@/app/lib/prisma";
import AdminProductForm from "@/app/components/admin/AdminProductForm";

const NewProduct = async () => {

    const categories = await prisma.category.findMany({
        orderBy: {
            name: 'asc'
        }
    })

    return (
        <div className="space-y-6 px-20 py-4">
            {/* Formulaire d'édition */}
            <AdminProductForm categories={categories} />
        </div>
    );
}

export default NewProduct