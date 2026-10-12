import api, { getCsrfToken } from './axios'

// POST /auth/login/ -> { access }  (refresh arrives as an HttpOnly cookie)
export async function login({ email, password }) {
    const { data } = await api.post('/auth/login/', { email, password })
    return data
}

// POST /auth/register/ -> 201 (no tokens; the user logs in next)
export async function register({ email, full_name, password, password2 }) {
    const { data } = await api.post('/auth/register/', { email, full_name, password, password2 })
    return data
}

// GET /auth/me/ (Bearer) -> { id, email, full_name }
export async function getMe() {
    const { data } = await api.get('/auth/me/')
    return data
}

// POST /auth/logout/ (no body, X-CSRFToken) -> 205
export async function logout() {
    const csrf = await getCsrfToken()
    await api.post('/auth/logout/', null, { headers: { 'X-CSRFToken': csrf } })
}


//POST /auth?password-reset/ email/ -> { detail } (same response whether or not the email exists)
export async function requestPasswordReset(email) {
    const { data } = await api.post('/auth/password-reset/', { email })
    return data
}

//POST /atuh/password-reset/confirm/{uid}/{token}/ {password, password2} -> {detail}
// 400: fresh errors, or {detail: "Invalid link" | "Incalid opr expired token"}
export async function confirmPasswordReset({ uid, token, password, password2 }) {
    const url = `/auth/password-reset/confirm/${encodeURIComponent(uid)}/${encodeURIComponent(token)}/`
    const { data } = await api.post(url, { password, password2 })
    return data
}
