interface TopProductData {
    id: number,
    title: string,
    _count: {review: number}
    category: {
        name: string
    },
}

interface AdminTopProductProps {
    topProducts: TopProductData[]
}

const AdminTopProduct = ({topProducts} : AdminTopProductProps) => {
    return (
        <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 '>
            <h2 className='text-lg font-semibold mb-4 text-gray-700'>Produit les plus consultes</h2>
            {topProducts.length === 0 ? (
                <p className='text-gray-400 text-sm'>Aucun produit disponible.</p>
            ) : (
                <table className='w-full text-sm'>
                    <thead>
                        <tr className='text-left text-gray-500 border-b border-gray-200'>
                            <th className='pb-2 font-medium'>Produit</th>
                            <th className='pb-2 font-medium'>Categorie</th>
                            <th className='pb-2 font-medium text-center'>Avis</th>
                            <th className='pb-2 font-medium text-right'>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            topProducts.map((product) => (
                                <tr key={product.id} className='border-b border-gray-100 last:border-0'>
                                    <td className='py-2 font-medium text-gray-800'>{product.title}</td>
                                    <td className='py-2 text-gray-500'>{product.category.name}</td>
                                    <td className='py-2 text-center text-gray-500'>{product._count.review}</td>
                                    <td className='py-2 text-right'>
                                        <span className='text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full'>Publie</span>
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            )}
        </div>
    )
}

export {AdminTopProduct}