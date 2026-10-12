import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { queryKeys } from '../../api/queryKeys';
import {
    getCart, addCartItem, updateCartItem, removeCartItem, selectCartItems,
} from '../../api/cart.api';
import { getErrorMessage } from '../../utils/getErrorMessage';

export const useCart = () => useQuery({ queryKey: queryKeys.cart, queryFn: getCart });

export const useCartCount = () => {
    const { data } = useCart();
    return selectCartItems(data).reduce((n, item) => n + (item.quantity ?? 0), 0);
};

function useCartMutation(mutationFn, successMessage) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.cart });
            if (successMessage) toast.success(successMessage);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });
}

export const useAddToCart = () => useCartMutation(addCartItem, 'Added to cart');
export const useUpdateCartItem = () => useCartMutation(updateCartItem);
export const useRemoveCartItem = () => useCartMutation(removeCartItem, 'Item removed');