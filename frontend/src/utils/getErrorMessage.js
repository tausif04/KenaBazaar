const flatten = (value) => {
    if (Array.isArray(value)) return value.flatMap(flatten);
    if (value && typeof value === 'object') return Object.values(value).flatMap(flatten);
    return value == null ? [] : [String(value)];
};

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
    if (!error?.response) return 'Cannot reach the server. Check your connection and try again.';
    const { status, data } = error.response;
    if (status === 429) return 'Too many requests. Please wait a moment.';
    if (status >= 500) return fallback;
    if (typeof data === 'string') return data.trim().startsWith('<') ? fallback : data;
    if (data?.detail) return String(data.detail);
    const messages = flatten(data);
    return messages.length ? messages.join(' ') : fallback;
}

// DRF answers 401 (or 403 depending on authenticator order) for anonymous users on JWT-only routes.
export const isAuthError = (error) => [401, 403].includes(error?.response?.status);