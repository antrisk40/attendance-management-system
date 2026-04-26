import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { Users, Clock, Settings, Loader2 } from 'lucide-react'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayAttendance: 0,
    pendingRequests: 0
  })
  const [todayRecords, setTodayRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { error } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const [usersRes, attendanceRes, requestsRes] = await Promise.all([
        api.get('/admin/users?limit=1'),
        api.get('/admin/attendance'),
        api.get('/hr/pending-requests?limit=1')
      ])

      setStats({
        totalUsers: usersRes.data.data.pagination.total,
        todayAttendance: attendanceRes.data.data.pagination.total,
        pendingRequests: requestsRes.data.data.pagination.total
      })
      setTodayRecords(attendanceRes.data.data.records)
    } catch (err) {
      error('Failed to fetch dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return '--:--'
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <a href="/admin/users" className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </a>

            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Checked In Today</p>
                  <p className="text-3xl font-bold">{stats.todayAttendance}</p>
                </div>
              </div>
            </div>

            <a href="/hr" className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Settings className="text-yellow-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Requests</p>
                  <p className="text-3xl font-bold">{stats.pendingRequests}</p>
                </div>
              </div>
            </a>
          </div>

          {/* Today's Attendance */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Today's Attendance</h2>
            
            {todayRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No attendance records for today</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {todayRecords.slice(0, 10).map((record) => (
                      <tr key={record.id}>
                        <td>{record.user?.firstName} {record.user?.lastName}</td>
                        <td>{formatTime(record.clockIn)}</td>
                        <td>{formatTime(record.clockOut)}</td>
                        <td>{record.workHours || '--'}</td>
                        <td>
                          <span className={`badge ${
                            record.status === 'PRESENT' ? 'badge-green' : 
                            record.status === 'ABSENT' ? 'badge-red' : 'badge-gray'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDashboard
