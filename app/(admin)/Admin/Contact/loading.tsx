export default function Loading() {
  return (
    <div className="space-y-6 px-20 py-4 animate-pulse">
      <div className="h-16 bg-gray-200 rounded-lg"></div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-24 bg-gray-200 rounded-lg"></div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-96 bg-gray-200 rounded-lg"></div>
    </div>
  )
}