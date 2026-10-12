import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../features/cart/hooks';
import { selectCartItems, selectCartTotal } from '../api/cart.api';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import { EmptyState, ErrorState } from '../components/common/StateMessage';
import { getErrorMessage } from '../utils/getErrorMessage';
import { buttonClasses } from '../utils/ui';

function CartSkeleton() {
    return (
        <div className="grid gap-6 lg:grid-cols-3" aria-busy="true" aria-label="Loading cart">
            <div className="space-y-3 lg:col-span-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />)}
            </div>
            <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
        </div>
    );
}

export default function CartPage() {
    const { data, isLoading, isError, error, refetch } = useCart();
    const update = useUpdateCartItem();
    const remove = useRemoveCartItem();

    const items = selectCartItems(data);
    const busyId =
        (update.isPending && update.variables?.itemId) || (remove.isPending && remove.variables) || null;

    const changeQuantity = (itemId, quantity) => {
        if (quantity < 1) return;
        update.mutate({ itemId, quantity });
    };

    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold">Your cart</h1>

            {isLoading ? (
                <CartSkeleton />
            ) : isError ? (
                <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
            ) : items.length === 0 ? (
                <EmptyState
                    icon={ShoppingBag}
                    title="Your cart is empty"
                    message="Looks like you haven't added anything yet."
                    action={<Link to="/products" className={buttonClasses('primary')}>Continue shopping</Link>}
                />
            ) : (
                <div className="grid gap-6 lg:grid-cols-3">
                    <ul className="space-y-3 lg:col-span-2" aria-label="Cart items">
                        {items.map((item) => (
                            <CartItem
                                key={item.id}
                                item={item}
                                busy={busyId === item.id}
                                onQuantity={changeQuantity}
                                onRemove={(id) => remove.mutate(id)}
                            />
                        ))}
                    </ul>
                    <CartSummary itemCount={items.reduce((n, i) => n + i.quantity, 0)} total={selectCartTotal(data)} />
                </div>
            )}
        </div>
    );
}