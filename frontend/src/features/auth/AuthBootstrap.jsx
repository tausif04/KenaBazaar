import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { queryKeys } from '../../api/queryKeys'
import { bootstrapAuth, loggedOut, selectAuthStatus } from './authSlice'
import { onAuthFailure } from './tokenStorage'

export default function AuthBootstrap({ children }) {
    const dispatch = useDispatch()
    const qc = useQueryClient()
    const status = useSelector(selectAuthStatus)

    useEffect(() => {
        dispatch(bootstrapAuth())
        return onAuthFailure(() => {
            dispatch(loggedOut())
            qc.removeQueries({ queryKey: queryKeys.wishlist })
            toast.error('Your session expired. Please log in again.')
        })
    }, [dispatch, qc])

    // Hold the app until the session is restored, so no query fires without a token.
    if (status === 'bootstrapping') {
        return (
            <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-600" />
                <span className="sr-only">Restoring your session…</span>
            </div>
        )
    }
    return children
}