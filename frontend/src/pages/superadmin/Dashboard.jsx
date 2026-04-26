import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { Building2, Users, Activity, Loader2 } from 'lucide-react'

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    totalAuditLogs: 0
  })
  const [recentCompanies, setRecentCompanies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { error } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const [companiesRes, logsRes] = await Promise.all([
        api.get('/superadmin/companies'),
        api.get('/superadmin/audit-logs?limit=1')
      ])

      const companies = companiesRes.data.data.companies
      const totalUsers = companies.reduce((sum, c) => sum + (c._count?.users || 0), 0)

      setStats({
        totalCompanies: companiesRes.data.data.pagination.total,
        totalUsers,
        totalAuditLogs: logsRes.data.data.pagination.total
      })
      setRecentCompanies(companies.slice(0, 5))
    } catch (err) {
      error('Failed to fetch dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Super Admin Dashboard</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <a href="/superadmin/companies" className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Companies</p>
                  <p className="text-3xl font-bold">{stats.totalCompanies}</p>
                </div>
              </div>
            </a>

            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <a href="/superadmin/audit-logs" className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Audit Logs</p>
                  <p className="text-3xl font-bold">{stats.totalAuditLogs}</p>
                </div>
              </div>
            </a>
          </div>

          {/* Recent Companies */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Recent Companies</h2>
            
            {recentCompanies.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No companies yet</p>
            ) : (
              <div className="space-y-3">
                {recentCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-gray-500">{company.slug}</p>
                    </div>
                    <div className="text-right text-sm">
                      <span className={`badge ${company.isActive ? 'badge-green' : 'badge-red'}`}>
                        {company.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <p className="text-gray-500 mt-1">
                        {company._count?.users || 0} users
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default SuperAdminDashboard
