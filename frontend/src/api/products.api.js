import api from './client';

const dropEmpty = (params) =>
    Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );

// params: { category, search, ordering, page, page_size } (the only params the API documents)
export async function getProducts(params = {}) {
    const { data } = await api.get('/products/', { params: dropEmpty(params) });
    return data; // { count, next, previous, results }
}

export async function getProduct(id) {
    const { data } = await api.get(`/products/${id}/`);
    return data;
}