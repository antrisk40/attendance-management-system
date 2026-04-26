import axios from 'axios'

// Local dev: use relative "/api" + Vite proxy. Static hosts (Netlify, etc.): set VITE_API_BASE_URL
// at build time to your real API, e.g. https://api.yourdomain.com/api (include the /api path)
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    '[attendance] Set VITE_API_BASE_URL in your build (e.g. Netlify env) to your API base URL, e.g. https://api.example.com/api — relative /api will 404 on static hosting.'
  )
}

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('tokens')
    if (tokens) {
      const { accessToken } = JSON.parse(tokens)
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const tokens = JSON.parse(localStorage.getItem('tokens') || '{}')
        const refreshResponse = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken: tokens.refreshToken,
        })

        const { accessToken } = refreshResponse.data.data
        const newTokens = { ...tokens, accessToken }

        localStorage.setItem('tokens', JSON.stringify(newTokens))
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('tokens')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
