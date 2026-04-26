import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth()
  const roleName = user?.role?.name ?? user?.role

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(roleName)) {
    // Redirect to appropriate dashboard based on role
    const roleRoutes = {
      SUPER_ADMIN: '/superadmin',
      ADMIN: '/admin',
      HR: '/hr',
      EMPLOYEE: '/employee'
    }
    return <Navigate to={roleRoutes[roleName] || '/employee'} replace />
  }

  return children
}

export default ProtectedRoute
