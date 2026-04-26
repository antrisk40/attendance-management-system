import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { Plus, Edit2, Users, Loader2, X } from 'lucide-react'

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const { success, error } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  })

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/superadmin/companies')
      setCompanies(response.data.data.companies)
    } catch (err) {
      error('Failed to fetch companies')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/superadmin/companies', formData)
      success('Company created')
      setShowModal(false)
      setFormData({ name: '', slug: '' })
      fetchCompanies()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create company')
    }
  }

  const handleUpdate = async (id, isActive) => {
    try {
      await api.patch(`/superadmin/companies/${id}`, { isActive })
      success(`Company ${isActive ? 'activated' : 'deactivated'}`)
      fetchCompanies()
    } catch (err) {
      error('Update failed')
    }
  }

  const viewCompanyDetails = async (company) => {
    try {
      const [detailsRes, usersRes] = await Promise.all([
        api.get(`/superadmin/companies/${company.id}`),
        api.get(`/superadmin/companies/${company.id}/users?limit=5`)
      ])
      setSelectedCompany({
        ...detailsRes.data.data,
        recentUsers: usersRes.data.data.users
      })
    } catch (err) {
      error('Failed to fetch company details')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Company Management</h1>
        <button
          onClick={() => {
            setFormData({ name: '', slug: '' })
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Company
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <div className="space-y-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{company.name}</h3>
                      <span className={`badge ${company.isActive ? 'badge-green' : 'badge-red'}`}>
                        {company.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{company.slug}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {company._count?.users || 0} users · {company._count?.attendanceRecords || 0} records
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewCompanyDetails(company)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="View Details"
                    >
                      <Users size={18} />
                    </button>
                    <button
                      onClick={() => handleUpdate(company.id, !company.isActive)}
                      className={`p-2 rounded-lg ${
                        company.isActive
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={company.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {companies.length === 0 && (
              <p className="text-center py-12 text-gray-500">No companies found</p>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create Company</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Company Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Acme Corporation"
                  required
                />
              </div>

              <div>
                <label className="label">Slug (URL identifier)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="input"
                  placeholder="e.g., acme-corp"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company Details Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedCompany.name}</h2>
              <button
                onClick={() => setSelectedCompany(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Settings</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>Work Hours: {selectedCompany.settings?.workStartTime} - {selectedCompany.settings?.workEndTime}</p>
                  <p>Grace Period: {selectedCompany.settings?.gracePeriodMin} min</p>
                  <p>Full Day: {selectedCompany.settings?.fullDayHours} hours</p>
                  <p>Timezone: {selectedCompany.settings?.timezone}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Recent Users</h3>
                {selectedCompany.recentUsers?.length === 0 ? (
                  <p className="text-gray-500 text-sm">No users yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCompany.recentUsers?.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <span className="badge badge-gray">{user.role.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompanyManagement
