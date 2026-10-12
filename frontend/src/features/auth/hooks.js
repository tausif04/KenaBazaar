import { useDispatch, useSelector } from 'react-redux'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getMe, login, logout, register } from '../../api/auth.api'
import { queryKeys } from '../../api/queryKeys'
import { loggedIn, loggedOut, selectAuthStatus, selectUser } from './authSlice'
import { clearAuth, setAccessToken, setSessionHint } from './tokenStorage'

export function useAuth() {
    const status = useSelector(selectAuthStatus)
    const user = useSelector(selectUser)
    return {
        user,
        status,
        isAuthenticated: status === 'authenticated',
        isBootstrapping: status === 'bootstrapping',
    }
}

// Answers that change with identity: the backend merged the guest cart at login, and
// wishlist/categories were 401 for guests.
const identityQueries = [queryKeys.cart, queryKeys.wishlist, queryKeys.categories]

export function useLogin() {
    const dispatch = useDispatch()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (credentials) => {
            const { access } = await login(credentials)
            setAccessToken(access)
            setSessionHint()
            return getMe()
        },
        onSuccess: (user) => {
            dispatch(loggedIn(user))
            identityQueries.forEach((queryKey) => qc.invalidateQueries({ queryKey }))
        },
        onError: () => clearAuth(),
    })
}

export const useRegister = () => useMutation({ mutationFn: register })

export function useLogout() {
    const dispatch = useDispatch()
    const qc = useQueryClient()
    return useMutation({
        // Best effort on the server (blacklist + clear cookie); always log out locally.
        mutationFn: async () => {
            try {
                await logout()
            } catch {
                /* local logout still proceeds */
            }
        },
        onSettled: () => {
            clearAuth()
            dispatch(loggedOut())
            qc.removeQueries({ queryKey: queryKeys.wishlist })
            qc.invalidateQueries({ queryKey: queryKeys.cart })
        },
    })
}