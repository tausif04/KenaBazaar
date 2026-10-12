import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys';
import { getProducts, getProduct } from '../../api/products.api';
import { getCategories } from '../../api/categories.api';
import { isAuthError } from '../../utils/getErrorMessage';

export const useProducts = (params) =>
    useQuery({
        queryKey: queryKeys.products(params),
        queryFn: () => getProducts(params),
        placeholderData: keepPreviousData,
    });

export const useProduct = (id) =>
    useQuery({ queryKey: queryKeys.product(id), queryFn: () => getProduct(id), enabled: !!id });

// Backend currently requires auth for categories (verified live). Never retry a 401/403.
export const useCategories = () =>
    useQuery({
        queryKey: queryKeys.categories,
        queryFn: getCategories,
        staleTime: 10 * 60 * 1000,
        retry: (count, err) => !isAuthError(err) && count < 2,
    });