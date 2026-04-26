import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { Users, Clock, AlertCircle, Loader2 } from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const STATUS_COLORS = {
  Present: '#22c55e',
  Absent: '#ef4444',
  'Half day': '#f59e0b',
  'On leave': '#3b82f6',
  'Not checked in': '#94a3b8',
}

const formatEmployeeName = (u) => {
  if (!u) return 'Unknown'
  const full = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
  return full || u.email || 'Unknown'
}

const HRDashboard = () => {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const { error } = useToast()

  useEffect(() => {
    fetchDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const fetchDashboard = async () => {
    setIsLoading(true)
    try {
      const res = await api.get(`/hr/dashboard?date=${date}`)
      setData(res.data.data)
    } catch (err) {
      error('Failed to fetch HR dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const statusChartData = !data
    ? []
    : [
        { name: 'Present', value: data.statusCounts.present ?? 0 },
        { name: 'Absent', value: data.statusCounts.absent ?? 0 },
        { name: 'Half day', value: data.statusCounts.halfDay ?? 0 },
        { name: 'On leave', value: data.statusCounts.onLeave ?? 0 },
        { name: 'Not checked in', value: data.statusCounts.notCheckedIn ?? 0 },
      ].filter((x) => Number.isFinite(x.value))

  const topHoursChartData = !data
    ? []
    : (data.topWorkers ?? []).slice(0, 8).map((r) => ({
        name: formatEmployeeName(r.user),
        hours: Number(r.workHours ?? 0),
      }))

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">HR Dashboard</h1>
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : !data ? (
        <div className="card text-center py-10 text-gray-500">No data</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employees</p>
                  <p className="text-2xl font-bold">{data.totals.employees}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Clock className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Present</p>
                  <p className="text-2xl font-bold">{data.statusCounts.present}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Absent</p>
                  <p className="text-2xl font-bold">{data.statusCounts.absent}</p>
                </div>
              </div>
            </div>
            <a href="/hr/requests" className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <AlertCircle className="text-yellow-700" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Requests</p>
                  <p className="text-2xl font-bold">{data.totals.pendingRequests}</p>
                </div>
              </div>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <p className="text-sm text-gray-600">Half day</p>
              <p className="text-2xl font-bold">{data.statusCounts.halfDay}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">On leave</p>
              <p className="text-2xl font-bold">{data.statusCounts.onLeave}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Not checked in</p>
              <p className="text-2xl font-bold">{data.statusCounts.notCheckedIn}</p>
            </div>
            <a href={`/hr/attendance?date=${data.date}`} className="card hover:shadow-lg transition-shadow">
              <p className="text-sm text-gray-600">Open Attendance</p>
              <p className="text-2xl font-bold">View</p>
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="card lg:col-span-1">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-lg font-semibold">Attendance split</h2>
                  <p className="text-sm text-gray-500">Status distribution for selected date</p>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={48} />
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {statusChartData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card lg:col-span-2">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-lg font-semibold">Status counts</h2>
                  <p className="text-sm text-gray-500">Quick comparison across statuses</p>
                </div>
                <a
                  href={`/hr/attendance?date=${data.date}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View attendance →
                </a>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {statusChartData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold">Top work hours</h2>
                <p className="text-sm text-gray-500">Highest hours for selected date</p>
              </div>
            </div>

            {topHoursChartData.length > 0 && (
              <div className="h-72 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topHoursChartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.topWorkers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No attendance records</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Email</th>
                      <th>Hours</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.topWorkers.map((r) => (
                      <tr key={r.id}>
                        <td>{r.user?.firstName} {r.user?.lastName}</td>
                        <td>{r.user?.email}</td>
                        <td>{r.workHours ?? '--'}</td>
                        <td>{r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '--:--'}</td>
                        <td>{r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '--:--'}</td>
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

export default HRDashboard
