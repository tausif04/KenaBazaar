import { CreditCard, PackageCheck, ShieldCheck } from 'lucide-react';
import { useProducts } from '../features/products/hooks';
import HeroCarousel from '../components/home/HeroCarousel';
import ShortcutTiles from '../components/home/ShortcutTiles';
import DealsSection from '../components/home/DealsSection';
import CategoryTiles from '../components/home/CategoryTiles';
import ProductSection from '../components/home/ProductSection';
import { isOnSale } from '../utils/format';

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
            <h1 className="sr-only">KenaBazaar home</h1>
            <HeroCarousel />
            <ShortcutTiles />

            <DealsSection deals={deals} isLoading={latest.isLoading} error={latest.error} onRetry={latest.refetch} />

            <CategoryTiles />

            <ProductSection id="featured" title="Featured products" viewAllTo="/products"
                products={featured.data?.results ?? []} isLoading={featured.isLoading} error={featured.error} onRetry={featured.refetch} />

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