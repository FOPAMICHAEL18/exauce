import { prisma } from "@/app/lib/prisma";
import { notFound } from 'next/navigation';
import AdminProductForm from "@/app/components/admin/AdminProductForm";

// Parse un id de route. Refuse "12abc", "-5", "1.5", "".
function parseRouteId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null
  const n = Number(raw)
  if (!Number.isSafeInteger(n) || n <= 0) return null
  return n
}

const EditProductPage = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const productId = parseRouteId(id);

    if (productId === null) {
        notFound();
        throw new Error('unreachable');
    }

    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
    });

    if (!product) {
        notFound();
        throw new Error('unreachable');
    }

    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
    });

    return (
        <div className="space-y-6 px-20 py-4">
            <AdminProductForm categories={categories} productId={productId}/>
        </div>
    );
}

export default EditProductPage;