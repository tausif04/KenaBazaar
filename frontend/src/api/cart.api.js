import api from './client';

// Confirmed live shape: { id: number, items: CartItem[], total: number }
export async function getCart() {
    const { data } = await api.get('/cart/');
    return data;
}

// POST /cart/items/  body: { variant_id, quantity }
export async function addCartItem({ variantId, quantity = 1 }) {
    const { data } = await api.post('/cart/items/', { variant_id: variantId, quantity });
    return data;
}

// PATCH /cart/items/{id}/  body: { quantity }
export async function updateCartItem({ itemId, quantity }) {
    const { data } = await api.patch(`/cart/items/${itemId}/`, { quantity });
    return data;
}

// DELETE /cart/items/{id}/  -> 204
export async function removeCartItem(itemId) {
    await api.delete(`/cart/items/${itemId}/`);
}

export const selectCartItems = (cart) => cart?.items ?? [];
export const selectCartTotal = (cart) => cart?.total ?? 0; // number, server-computed