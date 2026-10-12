export const queryKeys = {
    products: (params = {}) => ['products', params],
    product: (id) => ['product', String(id)],
    categories: ['categories'],
    cart: ['cart'],
    wishlist: ['wishlist'],
    orders: ['orders'],
    order: (id) => ['order', String(id)],
}