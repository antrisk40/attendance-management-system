import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { Loader2 } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const toYmd = (d) => {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const AttendanceDashboard = () => {
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const { error } = useToast()
  const location = useLocation()

  const [filters, setFilters] = useState({
    date: toYmd(new Date()),
    status: '',
    sortBy: 'clockIn',
    sortOrder: 'desc',
  })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const dateParam = params.get('date')
    if (dateParam) setFilters((f) => ({ ...f, date: dateParam }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.date) params.set('date', filters.date)
    if (filters.status) params.set('status', filters.status)
    if (filters.sortBy) params.set('sortBy', filters.sortBy)
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
    return params.toString()
  }, [filters])

  useEffect(() => {
    fetchAttendance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString])

  const fetchAttendance = async () => {
    setIsLoading(true)
    try {
      const res = await api.get(`/hr/attendance?${queryString}`)
      setRecords(res.data.data.records)
    } catch (err) {
      error('Failed to fetch attendance')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return '--:--'
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half day</option>
              <option value="ON_LEAVE">On leave</option>
            </select>
          </div>

          <div>
            <label className="label">Sort by</label>
            <select
              className="input"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            >
              <option value="clockIn">Check in</option>
              <option value="clockOut">Check out</option>
              <option value="workHours">Work hours</option>
              <option value="createdAt">Created</option>
              <option value="user">Employee</option>
            </select>
          </div>

          <div>
            <label className="label">Order</label>
            <select
              className="input"
              value={filters.sortOrder}
              onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{r.user?.firstName} {r.user?.lastName}</td>
                    <td>{r.user?.email}</td>
                    <td>{formatTime(r.clockIn)}</td>
                    <td>{formatTime(r.clockOut)}</td>
                    <td>{r.workHours ?? '--'}</td>
                    <td>
                      <span className={`badge ${
                        r.status === 'PRESENT' ? 'badge-green' :
                        r.status === 'ABSENT' ? 'badge-red' :
                        'badge-gray'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      No attendance records
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AttendanceDashboard
