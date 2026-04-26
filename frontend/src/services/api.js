import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
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
        const refreshResponse = await axios.post('/api/auth/refresh', {
          refreshToken: tokens.refreshToken
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
