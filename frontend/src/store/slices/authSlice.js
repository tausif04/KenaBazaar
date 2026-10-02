import { createSlice } from '@reduxjs/toolkit'

// Shape only. Login/logout/refresh logic arrives in the auth phase.
const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
})

export default authSlice.reducer
