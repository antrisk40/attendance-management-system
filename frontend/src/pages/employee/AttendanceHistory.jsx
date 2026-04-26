import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const AttendanceHistory = () => {
  const [records, setRecords] = useState([])
  const [pagination, setPagination] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const { error } = useToast()

  useEffect(() => {
    fetchHistory()
  }, [page])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/attendance/history?page=${page}&limit=20`)
      setRecords(response.data.data.records)
      setPagination(response.data.data.pagination)
    } catch (err) {
      error('Failed to fetch attendance history')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return '--:--'
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status, isManual) => {
    const baseClass = 'badge '
    switch (status) {
      case 'PRESENT':
        return <span className={baseClass + 'badge-green'}>{isManual ? 'Present (Manual)' : 'Present'}</span>
      case 'ABSENT':
        return <span className={baseClass + 'badge-red'}>Absent</span>
      case 'HALF_DAY':
        return <span className={baseClass + 'badge-yellow'}>Half Day</span>
      default:
        return <span className={baseClass + 'badge-gray'}>{status}</span>
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Attendance History</h1>

      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="font-medium">{formatDate(record.clockIn || record.date)}</td>
                      <td>{formatTime(record.clockIn)}</td>
                      <td>{formatTime(record.clockOut)}</td>
                      <td>{record.workHours || '--'}</td>
                      <td>{getStatusBadge(record.status, record.isManual)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {records.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="mx-auto mb-2" size={48} />
                <p>No attendance records found</p>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="px-4 py-2 text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AttendanceHistory
