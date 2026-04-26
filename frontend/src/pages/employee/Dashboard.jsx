import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { Clock, CheckCircle, LogOut, Loader2 } from 'lucide-react'

const EmployeeDashboard = () => {
  const [todayStatus, setTodayStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { success, error } = useToast()

  useEffect(() => {
    fetchTodayStatus()
  }, [])

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const fetchTodayStatus = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/attendance/today')
      setTodayStatus(response.data.data)
    } catch (err) {
      error('Failed to fetch today status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckIn = async () => {
    setActionLoading(true)
    try {
      await api.post('/attendance/check-in')
      success('Checked in successfully')
      fetchTodayStatus()
    } catch (err) {
      error(err.response?.data?.message || 'Check-in failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setActionLoading(true)
    try {
      await api.post('/attendance/check-out')
      success('Checked out successfully')
      fetchTodayStatus()
    } catch (err) {
      error(err.response?.data?.message || 'Check-out failed')
    } finally {
      setActionLoading(false)
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return '--:--'
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrentTime = (date) => {
    if (!date) return '--:--:--'
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatCurrentDate = (date) => {
    if (!date) return '---'
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
  }

  const getStatusColor = () => {
    if (!todayStatus?.clockIn) return 'bg-gray-100 text-gray-600'
    if (todayStatus?.clockOut) return 'bg-green-100 text-green-700'
    return 'bg-blue-100 text-blue-700'
  }

  const getStatusText = () => {
    if (!todayStatus?.clockIn) return 'Not Checked In'
    if (todayStatus?.clockOut) return 'Checked Out'
    return 'Checked In'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Employee Dashboard</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Card */}
          <div className="card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold">Today's Status</h2>
              <div className="text-right">
                <p className="text-xs text-gray-500">{formatCurrentDate(currentTime)}</p>
                <p className="font-semibold tabular-nums text-gray-900">
                  {formatCurrentTime(currentTime)}
                </p>
              </div>
            </div>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusColor()} mb-6`}>
              <Clock size={20} />
              <span className="font-medium">{getStatusText()}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Check In</p>
                <p className="text-xl font-bold">{formatTime(todayStatus?.clockIn)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Check Out</p>
                <p className="text-xl font-bold">{formatTime(todayStatus?.clockOut)}</p>
              </div>
            </div>

            {todayStatus?.workHours && (
              <div className="bg-primary-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-primary-600">Total Hours</p>
                <p className="text-2xl font-bold text-primary-700">{todayStatus.workHours}h</p>
              </div>
            )}

            <div className="flex gap-3">
              {!todayStatus?.clockIn && (
                <button
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                  Check In
                </button>
              )}
              
              {todayStatus?.clockIn && !todayStatus?.clockOut && (
                <button
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  className="btn-danger flex-1 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <LogOut size={20} />}
                  Check Out
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a href="/employee/history" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-primary-600" size={20} />
                </div>
                <div>
                  <p className="font-medium">View History</p>
                  <p className="text-sm text-gray-500">See your past attendance</p>
                </div>
              </a>
              
              <a href="/employee/corrections" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-yellow-600" size={20} />
                </div>
                <div>
                  <p className="font-medium">Request Correction</p>
                  <p className="text-sm text-gray-500">Fix attendance errors</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeDashboard
