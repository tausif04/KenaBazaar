import axios from 'axios'

// Single shared client. Feature API modules import this; none create their own.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

export default api
