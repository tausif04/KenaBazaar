import { Link } from 'react-router-dom';
import { CreditCard, PackageCheck, ShieldCheck } from 'lucide-react';
import { useProducts } from '../features/products/hooks';
import CategoryTiles from '../components/home/CategoryTiles';
import ProductSection from '../components/home/ProductSection';
import { isOnSale } from '../utils/format';
import { buttonClasses } from '../utils/ui';

const TRUST = [
    { icon: CreditCard, title: 'Secure checkout', text: 'Payments are handled by Stripe.' },
    { icon: PackageCheck, title: 'Order history', text: 'Track your orders from your account.' },
    { icon: ShieldCheck, title: 'Accurate stock', text: 'Availability is shown straight from our inventory.' },
];

export default function HomePage() {
    const featured = useProducts({ page: 1, page_size: 8 });
    const latest = useProducts({ ordering: '-created_at', page: 1, page_size: 48 });

    const latestProducts = latest.data?.results ?? [];
    const newArrivals = latestProducts.slice(0, 8);
    const deals = latestProducts.filter(isOnSale).slice(0, 8);

    return (
        <div className="space-y-10">
            <section className="overflow-hidden rounded-2xl bg-orange-600 px-6 py-10 text-white md:px-12 md:py-16">
                <h1 className="max-w-xl text-3xl font-extrabold leading-tight md:text-5xl">Everything you need, delivered from KenaBazaar.</h1>
                <p className="mt-3 max-w-lg text-orange-50">Browse the latest products, find deals and check out securely.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link to="/products" className={`${buttonClasses('outline', 'lg')} border-white`}>Shop now</Link>
                    <Link to="/products?ordering=-created_at" className={`${buttonClasses('ghost', 'lg')} text-white hover:bg-orange-700`}>New arrivals</Link>
                </div>
            </section>

            <CategoryTiles />

            <ProductSection id="featured" title="Featured products" viewAllTo="/products"
                products={featured.data?.results ?? []} isLoading={featured.isLoading} error={featured.error} onRetry={featured.refetch} />

            <ProductSection id="deals" title="Deals" subtitle="Products currently on sale" accent hideWhenEmpty
                products={deals} isLoading={latest.isLoading} error={latest.error} onRetry={latest.refetch} />

            <ProductSection id="new" title="New arrivals" viewAllTo="/products?ordering=-created_at"
                products={newArrivals} isLoading={latest.isLoading} error={latest.error} onRetry={latest.refetch} />

            <section aria-label="Shopping benefits" className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 md:grid-cols-3">
                {TRUST.map(({ icon: Icon, title, text }) => (
                    <div key={title} className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h3 className="font-semibold">{title}</h3>
                            <p className="text-sm text-gray-600">{text}</p>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}