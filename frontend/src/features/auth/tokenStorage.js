const HINT_KEY = 'kb_has_session'

let accessToken = null // memory only, gone on page reload by design
const failureListeners = new Set()


const safe = (fn) => {
    try {
        return fn()
    } catch {
        return null
    }
}

export const getAccessToken = () => accessToken
export const setAccessToken = (token) => {
    accessToken = token
}

// Non-secret flag: "this browser probably has a refresh cookie". The cookie itself is
// HttpOnly, so JavaScript cannot see it. Only used to decide whether to try a refresh.
export const hasSessionHint = () => safe(() => localStorage.getItem(HINT_KEY) === '1') === true
export const setSessionHint = () => safe(() => localStorage.setItem(HINT_KEY, '1'))

export function clearAuth() {
    accessToken = null
    safe(() => localStorage.removeItem(HINT_KEY))
}

// Lets the Axios layer tell the app "the session is dead" without importing Redux.
export function onAuthFailure(listener) {
    failureListeners.add(listener)
    return () => failureListeners.delete(listener)
}
export const emitAuthFailure = () => failureListeners.forEach((fn) => fn())