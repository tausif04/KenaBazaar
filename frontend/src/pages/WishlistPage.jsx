import { Heart, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../features/wishlist/hooks';
import WishlistCard from '../components/product/WishlistCard';
import ProductGrid from '../components/product/ProductGrid';
import { EmptyState, ErrorState } from '../components/common/StateMessage';
import { getErrorMessage, isAuthError } from '../utils/getErrorMessage';
import { buttonClasses } from '../utils/ui';

export default function WishlistPage() {
    const { data, isLoading, isError, error, refetch } = useWishlist();

    let body;
    if (isLoading) {
        body = <ProductGrid isLoading skeletonCount={4} />;
    } else if (isError && isAuthError(error)) {
        body = (
            <EmptyState
                icon={LogIn}
                title="Log in to see your wishlist"
                message="Your saved products are tied to your account."
                action={<Link to="/login" className={buttonClasses('primary')}>Log in</Link>}
            />
        );
    } else if (isError) {
        body = <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
    } else if (data.length === 0) {
        body = (
            <EmptyState
                icon={Heart}
                title="Your wishlist is empty"
                message="Tap the heart on any product to save it here."
                action={<Link to="/products" className={buttonClasses('primary')}>Browse products</Link>}
            />
        );
    } else {
        body = (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {data.map((item) => <WishlistCard key={item.id} item={item} />)}
            </div>
        );
    }

    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold">Wishlist</h1>
            {body}
        </div>
    );
}