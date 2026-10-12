import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/format';
import { buttonClasses } from '../../utils/ui';

export default function CartSummary({ itemCount, total, disabled = false }) {
    return (
        <aside aria-label="Order summary" className="rounded-xl border border-gray-200 bg-white p-5 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                    <dt className="text-gray-600">Items</dt>
                    <dd className="font-medium">{itemCount}</dd>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3 text-base">
                    <dt className="font-semibold">Total</dt>
                    <dd className="font-bold text-gray-900">{formatPrice(total)}</dd>
                </div>
            </dl>
            <Link
                to="/checkout"
                aria-disabled={disabled}
                onClick={(e) => disabled && e.preventDefault()}
                className={`${buttonClasses('primary', 'lg')} mt-5 w-full ${disabled ? 'pointer-events-none opacity-50' : ''}`}
            >
                Proceed to checkout
            </Link>
            <Link to="/products" className={`${buttonClasses('outline', 'md')} mt-3 w-full`}>
                Continue shopping
            </Link>
        </aside>
    );
}