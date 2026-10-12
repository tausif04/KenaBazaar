import api from './client';

export async function getCategories() {
    const { data } = await api.get('/categories/');
    return data; // [{ id, name, slug }]
}