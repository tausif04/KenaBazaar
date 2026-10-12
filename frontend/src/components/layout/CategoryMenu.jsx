import { Link } from 'react-router-dom';
import { useCategories } from '../../features/products/hooks';
import { getErrorMessage, isAuthError } from '../../utils/getErrorMessage';

export default function CategoryMenu({ onNavigate }) {
    const { data, isLoading, error, refetch } = useCategories();

    if (isLoading) return <p className="px-3 py-2 text-sm text-gray-500">Loading categories…</p>;

    if (isAuthError(error)) {
        return (
            <div className="px-3 py-2 text-sm text-gray-600">
                <Link to="/login" onClick={onNavigate} className="font-semibold text-orange-600 hover:underline">
                    Log in
                </Link>{' '}
                to browse categories.
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-3 py-2 text-sm text-gray-600">
                {getErrorMessage(error)}{' '}
                <button type="button" onClick={() => refetch()} className="font-semibold text-orange-600 hover:underline">
                    Retry
                </button>
            </div>
        );
    }

    const categories = (data ?? []).filter((c) => c.slug);
    if (categories.length === 0) return <p className="px-3 py-2 text-sm text-gray-500">No categories yet.</p>;

    return (
        <ul>
            {categories.map((c) => (
                <li key={c.id}>
                    <Link
                        to={`/products?category=${encodeURIComponent(c.slug)}`}
                        onClick={onNavigate}
                        className="block rounded-md px-3 py-2 text-sm text-gray-800 hover:bg-orange-50 hover:text-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    >
                        {c.name}
                    </Link>
                </li>
            ))}
        </ul>
    );
}