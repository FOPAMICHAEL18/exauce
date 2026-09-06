export default function GlobalLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* Skeleton Header / Hero */}
      <div className="space-y-4">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-8 w-2/3 md:w-1/2 bg-gray-200 rounded-lg" />
        <div className="h-4 w-5/6 bg-gray-100 rounded" />
      </div>

      {/* Skeleton Contenu Principal (Grille de 3 blocs génériques) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-xl p-4 space-y-3 border border-gray-100">
            <div className="h-6 w-1/2 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-4/5 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}