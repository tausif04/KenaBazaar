export default function ProductCardSkeleton() {
    return (
        <div className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white" aria-hidden="true">
            <div className="aspect-square bg-gray-200" />
            <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/3 rounded bg-gray-200" />
                <div className="h-10 rounded-lg bg-gray-200" />
            </div>
        </div>
    );
}