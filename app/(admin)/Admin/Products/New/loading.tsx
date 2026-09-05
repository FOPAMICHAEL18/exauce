export default function Loading() {
  return (
    <div className="space-y-6 px-20 py-4 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 bg-gray-200 rounded-xl h-120"></div>
        <div className="lg:col-span-5 bg-gray-200 rounded-xl  "></div>
      </div>
    </div>
  )
}