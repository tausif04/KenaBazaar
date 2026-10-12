import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { refreshAccessToken } from '../../api/axios'
import { getMe } from '../../api/auth.api'
import { clearAuth, hasSessionHint } from './tokenStorage'

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async (_, { rejectWithValue }) => {
    if (!hasSessionHint()) return rejectWithValue('no-session')
    try {
        await refreshAccessToken()
        return await getMe()
    } catch (error) {
        // Server said the session is invalid -> forget it. Offline/timeout -> keep the hint.
        if ([400, 401].includes(error.response?.status)) clearAuth()
        return rejectWithValue('restore-failed')
    }
})

const initialState = {
    user: null, // { id, email, full_name }
    status: hasSessionHint() ? 'bootstrapping' : 'anonymous',
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loggedIn(state, action) {
            state.user = action.payload
            state.status = 'authenticated'
        },
        loggedOut(state) {
            state.user = null
            state.status = 'anonymous'
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(bootstrapAuth.fulfilled, (state, action) => {
                state.user = action.payload
                state.status = 'authenticated'
            })
            .addCase(bootstrapAuth.rejected, (state) => {
                state.user = null
                state.status = 'anonymous'
            })
    },
})

export const { loggedIn, loggedOut } = authSlice.actions
export const selectAuthStatus = (state) => state.auth.status
export const selectUser = (state) => state.auth.user
export default authSlice.reducer