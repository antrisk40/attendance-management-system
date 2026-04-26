import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { Plus, X, Clock, FileText, Loader2 } from 'lucide-react'

const CorrectionRequests = () => {
  const [requests, setRequests] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const { success, error } = useToast()

  const [formData, setFormData] = useState({
    attendanceId: '',
    requestType: 'MISSED_IN',
    correctedTime: '',
    reason: ''
  })

  useEffect(() => {
    fetchRequests()
    fetchAttendanceHistory()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await api.get('/corrections/my-requests')
      setRequests(response.data.data.requests)
    } catch (err) {
      error('Failed to fetch correction requests')
    }
  }

  const fetchAttendanceHistory = async () => {
    try {
      const response = await api.get('/attendance/history?limit=100')
      setAttendanceRecords(response.data.data.records)
    } catch (err) {
      error('Failed to fetch attendance history')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await api.post('/corrections', formData)
      success('Correction request submitted')
      setShowModal(false)
      setFormData({ attendanceId: '', requestType: 'MISSED_IN', correctedTime: '', reason: '' })
      fetchRequests()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to submit request')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-yellow">Pending</span>
      case 'APPROVED':
        return <span className="badge badge-green">Approved</span>
      case 'REJECTED':
        return <span className="badge badge-red">Rejected</span>
      default:
        return <span className="badge badge-gray">{status}</span>
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Correction Requests</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          New Request
        </button>
      </div>

      {/* Requests List */}
      <div className="card">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="mx-auto mb-2" size={48} />
            <p>No correction requests yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(request.status)}
                      <span className="text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>
                    <p className="font-medium">{request.requestType.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                    {request.remarks && (
                      <p className="text-sm text-gray-500 mt-2">
                        <span className="font-medium">Remarks:</span> {request.remarks}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {request.currentTime && (
                        <>
                          Current: {formatDate(request.currentTime)} {new Date(request.currentTime).toLocaleTimeString()}<br />
                        </>
                      )}
                      Corrected: {formatDate(request.correctedTime)} {new Date(request.correctedTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">New Correction Request</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Attendance Date</label>
                <select
                  value={formData.attendanceId}
                  onChange={(e) => setFormData({ ...formData, attendanceId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select a date</option>
                  {attendanceRecords.map((record) => (
                    <option key={record.id} value={record.id}>
                      {formatDate(record.date)} - {record.clockIn ? 'Checked In' : 'No Check In'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Request Type</label>
                <select
                  value={formData.requestType}
                  onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                  className="input"
                  required
                >
                  <option value="MISSED_IN">Missed Check In</option>
                  <option value="MISSED_OUT">Missed Check Out</option>
                  <option value="WRONG_IN">Wrong Check In Time</option>
                  <option value="WRONG_OUT">Wrong Check Out Time</option>
                </select>
              </div>

              <div>
                <label className="label">Corrected Time</label>
                <input
                  type="datetime-local"
                  value={formData.correctedTime}
                  onChange={(e) => setFormData({ ...formData, correctedTime: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Explain why you need this correction..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CorrectionRequests
