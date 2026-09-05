export default function Loading() {
  return (
    <div className="space-y-6 px-20 py-4 animate-pulse">
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='p-6 rounded-lg bg-gray-200 h-24'></div>
        <div className='p-6 rounded-lg bg-gray-200'></div>
        <div className='p-6 rounded-lg bg-gray-200'></div>
        <div className='p-6 rounded-lg bg-gray-200'></div>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-gray-200 p-6 rounded-lg h-96'></div>
        <div className='bg-gray-200 p-6 rounded-lg'></div>
      </div>
    </div>
  )
}

//Next.js (App Router) ne déclenche loading.tsx que si le composant de page (ou ses enfants) effectue une opération Asynchrone côté serveur (async/await), OU si les données sont récupérées au rendu serveur (SSR).