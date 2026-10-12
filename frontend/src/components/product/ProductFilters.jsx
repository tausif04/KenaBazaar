import { Link } from 'react-router-dom';
import { useCategories } from '../../features/products/hooks';
import { isAuthError } from '../../utils/getErrorMessage';

export const SORT_OPTIONS = [
    { value: '', label: 'Default' },
    { value: '-created_at', label: 'Newest first' },
    { value: 'regular_price', label: 'Price: low to high' },
    { value: '-regular_price', label: 'Price: high to low' },
];

const selectCls =
    'h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500';

export default function ProductFilters({ category, ordering, onCategory, onOrdering }) {
    const { data, isLoading, error } = useCategories();
    const categories = (data ?? []).filter((c) => c.slug);
    const needsLogin = isAuthError(error);

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <div>
                <label htmlFor="filter-category" className="mb-1 block text-xs font-semibold text-gray-600">Category</label>
                {needsLogin ? (
                    <p className="flex h-11 items-center text-sm text-gray-600">
                        <Link to="/login" className="mr-1 font-semibold text-orange-600 hover:underline">Log in</Link> to filter by category.
                    </p>
                ) : (
                    <select id="filter-category" className={selectCls} value={category} disabled={isLoading || !!error} onChange={(e) => onCategory(e.target.value)}>
                        <option value="">All categories</option>
                        {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                        {category && !categories.some((c) => c.slug === category) && <option value={category}>{category}</option>}
                    </select>
                )}
            </div>
            <div>
                <label htmlFor="filter-sort" className="mb-1 block text-xs font-semibold text-gray-600">Sort by</label>
                <select id="filter-sort" className={selectCls} value={ordering} onChange={(e) => onOrdering(e.target.value)}>
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>
        </div>
    );
}