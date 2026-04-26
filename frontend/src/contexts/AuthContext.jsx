import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tokens, setTokens] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const storedTokens = localStorage.getItem('tokens')
    if (storedTokens) {
      const parsed = JSON.parse(storedTokens)
      setTokens(parsed)
      fetchProfile(parsed.accessToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchProfile = async (token) => {
    try {
      const response = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data.data)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { user, tokens } = response.data.data
    
    setUser(user)
    setTokens(tokens)
    localStorage.setItem('tokens', JSON.stringify(tokens))
    
    // Redirect based on role
    const roleRoutes = {
      SUPER_ADMIN: '/superadmin',
      ADMIN: '/admin',
      HR: '/hr',
      EMPLOYEE: '/employee'
    }
    const roleName = user?.role?.name ?? user?.role
    navigate(roleRoutes[roleName] || '/employee')
    
    return user
  }

  const logout = async () => {
    if (tokens?.refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken: tokens.refreshToken })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    
    setUser(null)
    setTokens(null)
    localStorage.removeItem('tokens')
    navigate('/login')
  }

  const refreshAccessToken = async () => {
    if (!tokens?.refreshToken) {
      logout()
      return null
    }
    
    try {
      const response = await api.post('/auth/refresh', { 
        refreshToken: tokens.refreshToken 
      })
      const { accessToken } = response.data.data
      
      const newTokens = { ...tokens, accessToken }
      setTokens(newTokens)
      localStorage.setItem('tokens', JSON.stringify(newTokens))
      
      return accessToken
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
      return null
    }
  }

  const getAccessToken = () => tokens?.accessToken

  const value = {
    user,
    login,
    logout,
    loading,
    refreshAccessToken,
    getAccessToken,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext
