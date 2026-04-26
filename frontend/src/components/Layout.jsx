import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  LayoutDashboard, 
  Clock, 
  History, 
  FileText, 
  Users, 
  Settings, 
  Building2,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const Layout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
  }

  const getNavItems = () => {
    const roleName = user?.role?.name ?? user?.role
    switch (roleName) {
      case 'SUPER_ADMIN':
        return [
          { path: '/superadmin', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/superadmin/companies', icon: Building2, label: 'Companies' },
        ]
      case 'ADMIN':
        return [
          { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/admin/users', icon: Users, label: 'Users' },
          { path: '/admin/settings', icon: Settings, label: 'Settings' },
        ]
      case 'HR':
        return [
          { path: '/hr', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/hr/employees', icon: Users, label: 'Employees' },
          { path: '/hr/attendance', icon: Clock, label: 'Attendance' },
          { path: '/hr/requests', icon: FileText, label: 'Requests' },
        ]
      case 'EMPLOYEE':
      default:
        return [
          { path: '/employee', icon: Clock, label: 'Check In/Out' },
          { path: '/employee/history', icon: History, label: 'History' },
          { path: '/employee/corrections', icon: FileText, label: 'Corrections' },
        ]
    }
  }

  const navItems = getNavItems()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside 
        className={`bg-white shadow-lg transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b">
            {isSidebarOpen && (
              <span className="font-bold text-xl text-primary-600">AMS</span>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary-50 text-primary-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  <Icon size={20} />
                  {isSidebarOpen && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t p-4">
            {isSidebarOpen && (
              <div className="mb-3">
                <p className="font-medium text-sm">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">{user?.role?.name ?? user?.role}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title={!isSidebarOpen ? 'Logout' : undefined}
            >
              <LogOut size={20} />
              {isSidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
