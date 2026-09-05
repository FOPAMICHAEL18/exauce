export default function Loading() {
  return (
    <div className="space-y-6 px-20 py-4 animate-pulse">
      {/* Si vous voulez qu'un élément prenne 2 colonnes tout en gardant 3 éléments sur la même ligne, il faut définir 4 colonnes au total dans la grille. */}
      <div className=" grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Prend 2 colonnes sur desktop */}
        <div className="md:col-span-2 bg-gray-200  rounded-md h-10"></div>
        {/* Prend 1 colonne */}
        <div className="bg-gray-200 rounded-md h-10"></div>
        {/* Prend 1 colonne */}
        <div className="bg-gray-200 rounded-md h-10"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-lg  bg-gray-200 h-24"></div>
        <div className="p-6 rounded-lg  bg-gray-200"></div>
      </div>
      <div className='bg-gray-200 rounded-lg h-150 overflow-hidden '></div>
    </div>
  )
}