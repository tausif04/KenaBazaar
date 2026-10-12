import { formatPrice, isOnSale } from '../../utils/format';

export default function ProductPrice({ product, size = 'sm' }) {
    const onSale = isOnSale(product);
    const main = size === 'lg' ? 'text-2xl' : 'text-base';
    return (
        <div className="flex flex-wrap items-baseline gap-x-2">
            <span className={`${main} font-bold ${onSale ? 'text-orange-600' : 'text-gray-900'}`}>
                {formatPrice(product.current_price)}
            </span>
            {onSale && (
                <span className="text-sm text-gray-500 line-through">{formatPrice(product.regular_price)}</span>
            )}
        </div>
    );
}