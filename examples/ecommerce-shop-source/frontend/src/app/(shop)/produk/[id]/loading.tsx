import { Skeleton } from "@/components/ui/skeleton"

export default function ProdukDetailLoading() {
  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Main content skeleton */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-20 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Details skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-2 pt-4">
              <Skeleton className="h-12 w-32 rounded-xl" />
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
