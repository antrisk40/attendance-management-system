import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { CheckCircle, XCircle, FileText, Loader2 } from 'lucide-react'

const HRRequests = () => {
  const [pendingRequests, setPendingRequests] = useState([])
  const [allRequests, setAllRequests] = useState([])
  const [activeTab, setActiveTab] = useState('pending')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [reviewForm, setReviewForm] = useState({ status: 'APPROVED', remarks: '' })
  const { success, error } = useToast()

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const [pendingRes, allRes] = await Promise.all([
        api.get('/hr/pending-requests'),
        api.get('/hr/requests')
      ])
      setPendingRequests(pendingRes.data.data.requests)
      setAllRequests(allRes.data.data.requests)
    } catch (err) {
      error('Failed to fetch requests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReview = async (requestId) => {
    try {
      await api.post(`/hr/requests/${requestId}/review`, reviewForm)
      success(`Request ${reviewForm.status.toLowerCase()}`)
      setSelectedRequest(null)
      setReviewForm({ status: 'APPROVED', remarks: '' })
      fetchRequests()
    } catch (err) {
      error(err.response?.data?.message || 'Review failed')
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const requests = activeTab === 'pending' ? pendingRequests : allRequests

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Requests</h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'pending'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Pending ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          All Requests
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="mx-auto mb-2" size={48} />
            <p>No {activeTab} requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className={`border rounded-lg p-4 ${
                  request.status === 'PENDING' ? 'hover:shadow-md cursor-pointer' : ''
                }`}
                onClick={() => request.status === 'PENDING' && setSelectedRequest(request)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(request.status)}
                      <span className="text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>
                    <p className="font-medium">{request.requestType.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-600">
                      By: {request.requester?.firstName} {request.requester?.lastName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                    {request.remarks && (
                      <p className="text-sm text-gray-500 mt-2">
                        <span className="font-medium">Remarks:</span> {request.remarks}
                      </p>
                    )}
                    {request.approver && (
                      <p className="text-sm text-gray-500 mt-1">
                        Reviewed by: {request.approver.firstName} {request.approver.lastName}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    {request.currentTime && (
                      <p className="text-gray-600">
                        Current: {formatDate(request.currentTime)}
                      </p>
                    )}
                    <p className="text-gray-600">
                      Corrected: {formatDate(request.correctedTime)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Review Request</h2>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p><span className="font-medium">Type:</span> {selectedRequest.requestType.replace(/_/g, ' ')}</p>
              <p><span className="font-medium">Employee:</span> {selectedRequest.requester?.firstName} {selectedRequest.requester?.lastName}</p>
              <p><span className="font-medium">Reason:</span> {selectedRequest.reason}</p>
              {selectedRequest.currentTime && (
                <p><span className="font-medium">Current:</span> {formatDate(selectedRequest.currentTime)}</p>
              )}
              <p><span className="font-medium">Corrected:</span> {formatDate(selectedRequest.correctedTime)}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Decision</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setReviewForm({ ...reviewForm, status: 'APPROVED' })}
                    className={`flex-1 py-2 rounded-lg border-2 flex items-center justify-center gap-2 ${
                      reviewForm.status === 'APPROVED'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <CheckCircle size={20} />
                    Approve
                  </button>
                  <button
                    onClick={() => setReviewForm({ ...reviewForm, status: 'REJECTED' })}
                    className={`flex-1 py-2 rounded-lg border-2 flex items-center justify-center gap-2 ${
                      reviewForm.status === 'REJECTED'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <XCircle size={20} />
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Remarks (optional)</label>
                <textarea
                  value={reviewForm.remarks}
                  onChange={(e) => setReviewForm({ ...reviewForm, remarks: e.target.value })}
                  className="input"
                  placeholder="Add any remarks..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReview(selectedRequest.id)}
                  className={`flex-1 py-2 rounded-lg font-medium text-white ${
                    reviewForm.status === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {reviewForm.status === 'APPROVED' ? 'Approve Request' : 'Reject Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HRRequests

