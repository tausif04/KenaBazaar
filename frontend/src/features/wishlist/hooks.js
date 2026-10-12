import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { queryKeys } from '../../api/queryKeys'
import { getWishlist, addToWishlist, removeFromWishlist } from '../../api/wishlist.api'
import { getErrorMessage, isAuthError } from '../../utils/getErrorMessage'

export const useWishlist = () =>
    useQuery({
        queryKey: queryKeys.wishlist,
        queryFn: getWishlist,
        staleTime: 60 * 1000,
        retry: (count, err) => !isAuthError(err) && count < 2,
    })

// Map productId -> wishlistItemId so hearts know their state and what to DELETE.
// Never throws: a bad response just means "empty wishlist" here.
export function useWishlistLookup() {
    const query = useWishlist()
    const items = Array.isArray(query.data) ? query.data : []
    const map = useMemo(() => {
        const m = new Map()
        items.forEach((w) => m.set(w.product.id, w.id))
        return m
    }, [items])
    return { map, count: items.length, isAuthRequired: isAuthError(query.error) }
}

function useWishlistMutation(mutationFn, successMessage) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.wishlist })
            toast.success(successMessage)
        },
        onError: (err) =>
            toast.error(isAuthError(err) ? 'Please log in to use your wishlist.' : getErrorMessage(err)),
    })
}

export const useAddToWishlist = () => useWishlistMutation(addToWishlist, 'Saved to wishlist')
export const useRemoveFromWishlist = () =>
    useWishlistMutation(removeFromWishlist, 'Removed from wishlist')