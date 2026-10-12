import api from './client'

// GET /wishlist/ (JWT) -> [{ id, product, added_at }]
export async function getWishlist() {
    const { data } = await api.get('/wishlist/')
    if (!Array.isArray(data)) {
        throw new Error(`Unexpected wishlist response (${typeof data}). Check VITE_API_BASE_URL.`)
    }
    return data
}

// POST /wishlist/ body: { product_id }
export async function addToWishlist(productId) {
    const { data } = await api.post('/wishlist/', { product_id: productId })
    return data
}

// DELETE /wishlist/{wishlistItemId}/  (the wishlist row id, NOT the product id)
export async function removeFromWishlist(wishlistItemId) {
    await api.delete(`/wishlist/${wishlistItemId}/`)
}