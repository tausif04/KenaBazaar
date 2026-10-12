import api from './client'

// POST /checkout/session/ (JWT) -> 201 { order_id, checkout_url }
// 400: field errors, or { detail: "Your cart is empty." | "Only N of SKU in stock." }
export async function createCheckoutSession({ shipping_name, shipping_phone, shipping_address }) {
    const { data } = await api.post('/checkout/session/', {
        shipping_name,
        shipping_phone,
        shipping_address,
    })
    return data
}

// GET /orders/ (JWT) -> Order[]  (used in the Orders phase)
export async function getOrders() {
    const { data } = await api.get('/orders/')
    return data
}

// GET /orders/{id}/ (JWT) -> { id, status, total, shipping_*, items[], created_at, paid_at }
export async function getOrder(id) {
    const { data } = await api.get(`/orders/${id}/`)
    return data
}