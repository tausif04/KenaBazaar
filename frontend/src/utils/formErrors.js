import { getErrorMessage } from './getErrorMessage'

// Maps DRF { field: [messages] } onto react-hook-form fields.
// Returns true if at least one field error was placed.
export function applyServerErrors(error, setError, fields) {
    const data = error?.response?.data
    let applied = false
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        Object.entries(data).forEach(([field, messages]) => {
            if (fields.includes(field)) {
                setError(field, { type: 'server', message: [].concat(messages).join(' ') })
                applied = true
            }
        })
    }
    return applied
}

// Use this for anything that is not a field error.
export function setFormError(error, setError) {
    setError('root', { type: 'server', message: getErrorMessage(error) })
}