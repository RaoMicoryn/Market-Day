export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-navy/[0.06] bg-white">
      <div className="skeleton aspect-square rounded-none" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton mt-3 h-9 w-full rounded-full" />
      </div>
    </div>
  );
}

export function StoreCardSkeleton() {
  return (
    <div className="flex gap-3.5 overflow-hidden rounded-3xl border border-navy/[0.06] bg-white p-3 sm:flex-col sm:gap-0 sm:p-0">
      <div className="skeleton h-[104px] w-[104px] shrink-0 rounded-2xl sm:h-32 sm:w-full sm:rounded-none" />
      <div className="flex-1 space-y-2 py-1 sm:p-5">
        <div className="skeleton h-3 w-14" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6, variant = "product" }) {
  const Comp = variant === "store" ? StoreCardSkeleton : ProductCardSkeleton;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Comp key={i} />
      ))}
    </div>
  );
}

export function RowSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-20 w-full rounded-2xl" />
      ))}
    </div>
  );
}
