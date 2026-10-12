// Currency is NOT in the API. Assumption: configurable, defaults to BDT symbol.
const CURRENCY = import.meta.env.VITE_CURRENCY_SYMBOL ?? '৳';

export function formatPrice(value) {
    const n = Number(value);
    if (Number.isNaN(n)) return '';
    return `${CURRENCY}${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export const isOnSale = (product) =>
    product?.sale_price != null &&
    Number(product.sale_price) > 0 &&
    Number(product.sale_price) < Number(product.regular_price);

export const totalStock = (product) =>
    (product?.variants ?? []).reduce((sum, v) => sum + (v.stock ?? 0), 0);

export const primaryImage = (product) =>
    product?.images?.find((i) => i.is_primary) ?? product?.images?.[0] ?? null;

export const variantLabel = (v) =>
    [v?.size, v?.color].filter(Boolean).join(' / ') || v?.sku || 'Default';