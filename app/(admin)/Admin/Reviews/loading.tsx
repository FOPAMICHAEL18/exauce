export default function Loading() {
  return (
    <div className="space-y-6 px-20 py-4 animate-pulse">
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='p-6 rounded-lg bg-gray-200 h-24'></div>
        <div className='p-6 rounded-lg bg-gray-200'></div>
        <div className='p-6 rounded-lg bg-gray-200'></div>
      </div>
      <div className='bg-gray-200 p-6 rounded-lg h-140'>
      </div>
    </div>
  )
}