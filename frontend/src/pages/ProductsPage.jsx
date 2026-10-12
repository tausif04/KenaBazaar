import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, X } from 'lucide-react';
import { useProducts } from '../features/products/hooks';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilters from '../components/product/ProductFilters';
import Pagination from '../components/common/Pagination';
import { EmptyState, ErrorState } from '../components/common/StateMessage';
import { getErrorMessage } from '../utils/getErrorMessage';
import { buttonClasses } from '../utils/ui';

const PAGE_SIZE = 12;

export default function ProductsPage() {
    const [params, setParams] = useSearchParams();
    const search = params.get('search') ?? '';
    const category = params.get('category') ?? '';
    const ordering = params.get('ordering') ?? '';
    const page = Math.max(1, Number(params.get('page')) || 1);

    const { data, isLoading, isError, error, refetch, isFetching } = useProducts({
        search, category, ordering, page, page_size: PAGE_SIZE,
    });

    const update = (changes) => {
        const next = new URLSearchParams(params);
        Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        if (!('page' in changes)) next.delete('page');
        setParams(next);
    };

    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [page]);

    const clearAll = () => setParams(new URLSearchParams());
    const hasFilters = search || category || ordering;
    const pageMissing = isError && error?.response?.status === 404 && page > 1;

    return (
        <div>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-bold">{search ? `Results for “${search}”` : 'All products'}</h1>
                    {data && <p className="text-sm text-gray-600">{data.count} {data.count === 1 ? 'product' : 'products'}</p>}
                </div>
                {hasFilters && (
                    <button type="button" onClick={clearAll} className={buttonClasses('ghost', 'sm')}>
                        <X className="h-4 w-4" aria-hidden="true" /> Clear filters
                    </button>
                )}
            </div>

            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
                <ProductFilters
                    category={category}
                    ordering={ordering}
                    onCategory={(v) => update({ category: v })}
                    onOrdering={(v) => update({ ordering: v })}
                />
            </div>

            {pageMissing ? (
                <EmptyState icon={PackageSearch} title="That page doesn't exist" message="There aren't that many results."
                    action={<button type="button" className={buttonClasses('primary')} onClick={() => update({ page: '' })}>Go to first page</button>} />
            ) : isError ? (
                <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
            ) : isLoading ? (
                <ProductGrid isLoading skeletonCount={PAGE_SIZE} />
            ) : data.results.length === 0 ? (
                <EmptyState icon={PackageSearch} title="No products found"
                    message={hasFilters ? 'Try a different search or clear your filters.' : 'Check back soon for new products.'}
                    action={hasFilters && <button type="button" className={buttonClasses('primary')} onClick={clearAll}>Clear filters</button>} />
            ) : (
                <div className={isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
                    <ProductGrid products={data.results} />
                    <Pagination page={page} count={data.count} pageSize={PAGE_SIZE} disabled={isFetching} onChange={(p) => update({ page: p > 1 ? String(p) : '' })} />
                </div>
            )}
        </div>
    );
}