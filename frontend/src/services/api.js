import axios from 'axios'

/**
 * Resolve API base URL. Express mounts routes under `/api` (e.g. `/api/auth/login`).
 * - Local dev: unset → `/api` (Vite proxy).
 * - Production: set `VITE_API_BASE_URL` to your API host. You may use either:
 *   - `https://your-service.onrender.com/api` (explicit), or
 *   - `https://your-service.onrender.com` (origin only) — we append `/api` so requests
 *     hit `/api/auth/login`, not `/auth/login` (which 404s on Render).
 */
function resolveApiBase() {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!raw) return '/api'

  let base = raw.replace(/\/$/, '')
  if (base === '/api') return '/api'

  if (base.startsWith('http://') || base.startsWith('https://')) {
    try {
      const u = new URL(base)
      const path = u.pathname.replace(/\/$/, '') || '/'
      // Origin only (e.g. Render/Railway URL with no path) → append /api
      if (path === '/' || path === '') {
        u.pathname = '/api'
        return u.href.replace(/\/$/, '')
      }
    } catch {
      return base
    }
  }

  return base
}

const API_BASE = resolveApiBase()

if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    '[attendance] Set VITE_API_BASE_URL in your build (e.g. Netlify) to your API origin, e.g. https://your-app.onrender.com — relative /api will 404 on static hosting.'
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
