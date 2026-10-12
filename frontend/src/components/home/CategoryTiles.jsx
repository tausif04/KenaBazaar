import { Link } from 'react-router-dom';
import { useCategories } from '../../features/products/hooks';
import { getErrorMessage, isAuthError } from '../../utils/getErrorMessage';

export default function CategoryTiles() {
    const { data, isLoading, error, refetch } = useCategories();
    const categories = (data ?? []).filter((c) => c.slug);

    let body;
    if (isLoading) {
        body = (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-busy="true">
                {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />)}
            </div>
        );
    } else if (isAuthError(error)) {
        body = (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-700">
                <Link to="/login" className="font-semibold text-orange-600 hover:underline">Log in</Link> to browse by category, or{' '}
                <Link to="/products" className="font-semibold text-orange-600 hover:underline">view all products</Link>.
            </p>
        );
    } else if (error) {
        body = (
            <p className="text-sm text-gray-700">
                {getErrorMessage(error)}{' '}
                <button type="button" onClick={() => refetch()} className="font-semibold text-orange-600 hover:underline">Retry</button>
            </p>
        );
    } else if (categories.length === 0) {
        body = <p className="text-sm text-gray-600">No categories yet.</p>;
    } else {
        body = (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {categories.map((c) => (
                    <li key={c.id}>
                        <Link
                            to={`/products?category=${encodeURIComponent(c.slug)}`}
                            className="flex h-24 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-center text-sm font-semibold text-gray-900 transition-colors hover:border-orange-500 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                        >
                            {c.name}
                        </Link>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <section aria-labelledby="cats-title">
            <h2 id="cats-title" className="mb-4 text-xl font-bold md:text-2xl">Shop by category</h2>
            {body}
        </section>
    );
}