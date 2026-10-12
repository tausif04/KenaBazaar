console.log('API base URL =', import.meta.env.VITE_API_BASE_URL)

import axios from 'axios'
import {
  clearAuth,
  emitAuthFailure,
  getAccessToken,
  hasSessionHint,
  setAccessToken,
} from '../features/auth/tokenStorage'

const config = {
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // Render's free tier can take 20s+ to wake from sleep
  withCredentials: true, // session cookie (guest cart) + HttpOnly refresh cookie
}

// Main client (with interceptors) and a bare one for auth plumbing, so a failing
// refresh can never trigger another refresh.
const api = axios.create(config)
const bare = axios.create(config)

// Never attach a Bearer header to these: simplejwt rejects a stale token with 401
// even on public endpoints. (/auth/me/ is NOT listed: it needs the token.)
const NO_BEARER = [
  '/auth/login/',
  '/auth/register/',
  '/auth/refresh/',
  '/auth/logout/',
  '/auth/csrf/',
  '/auth/password-reset/',
]
const skipsBearer = (url = '') => NO_BEARER.some((p) => url.includes(p))

// ---- CSRF token (needed for cookie-backed POSTs: refresh, logout) ----
let csrfToken = null
let csrfPromise = null

export function getCsrfToken(force = false) {
  if (csrfToken && !force) return Promise.resolve(csrfToken)
  if (!csrfPromise) {
    csrfPromise = bare
      .get('/auth/csrf/')
      .then(({ data }) => {
        csrfToken = data.csrfToken
        return csrfToken
      })
      .finally(() => {
        csrfPromise = null
      })
  }
  return csrfPromise
}

// ---- Single-flight refresh ----
// Concurrent 401s share one request. With rotation + blacklisting, a second parallel
// refresh would reuse a blacklisted cookie and end the session.
let refreshPromise = null

async function doRefresh() {
  const attempt = async (forceCsrf) => {
    const token = await getCsrfToken(forceCsrf)
    return bare.post('/auth/refresh/', null, { headers: { 'X-CSRFToken': token } })
  }
  let response
  try {
    response = await attempt(false)
  } catch (error) {
    if (error.response?.status !== 403) throw error
    response = await attempt(true) // stale CSRF token: fetch a fresh one, retry once
  }
  setAccessToken(response.data.access)
  return response.data.access
}

export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

api.interceptors.request.use((request) => {
  const token = getAccessToken()
  if (token && !skipsBearer(request.url)) {
    request.headers.Authorization = `Bearer ${token}`
  }
  return request
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const canRetry =
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !skipsBearer(original.url) &&
      hasSessionHint()
    if (!canRetry) return Promise.reject(error)

    original._retry = true
    try {
      const access = await refreshAccessToken()
      original.headers.Authorization = `Bearer ${access}`
      return api(original)
    } catch (refreshError) {
      // Only the server's verdict ends the session. Timeouts, offline and CSRF 403s do not.
      if ([400, 401].includes(refreshError.response?.status)) {
        clearAuth()
        emitAuthFailure()
      }
      return Promise.reject(error)
    }
  },
)

export default api