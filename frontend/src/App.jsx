import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import EmployeeDashboard from './pages/employee/Dashboard'
import AttendanceHistory from './pages/employee/AttendanceHistory'
import CorrectionRequests from './pages/employee/CorrectionRequests'
import HRDashboard from './pages/hr/Dashboard'
import HREmployeeManagement from './pages/hr/EmployeeManagement'
import HRAttendanceDashboard from './pages/hr/AttendanceDashboard'
import HRRequests from './pages/hr/Requests'
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import CompanySettings from './pages/admin/CompanySettings'
import SuperAdminDashboard from './pages/superadmin/Dashboard'
import CompanyManagement from './pages/superadmin/CompanyManagement'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* Employee Routes */}
            <Route path="employee" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><EmployeeDashboard /></ProtectedRoute>} />
            <Route path="employee/history" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><AttendanceHistory /></ProtectedRoute>} />
            <Route path="employee/corrections" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><CorrectionRequests /></ProtectedRoute>} />
            
            {/* HR Routes */}
            <Route path="hr" element={<ProtectedRoute allowedRoles={['HR']}><HRDashboard /></ProtectedRoute>} />
            <Route path="hr/employees" element={<ProtectedRoute allowedRoles={['HR']}><HREmployeeManagement /></ProtectedRoute>} />
            <Route path="hr/attendance" element={<ProtectedRoute allowedRoles={['HR']}><HRAttendanceDashboard /></ProtectedRoute>} />
            <Route path="hr/requests" element={<ProtectedRoute allowedRoles={['HR']}><HRRequests /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UserManagement /></ProtectedRoute>} />
            <Route path="admin/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><CompanySettings /></ProtectedRoute>} />
            
            {/* Super Admin Routes */}
            <Route path="superadmin" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="superadmin/companies" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><CompanyManagement /></ProtectedRoute>} />
            
            {/* Default redirect */}
            <Route index element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
