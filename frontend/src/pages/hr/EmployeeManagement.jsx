import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { Loader2, Plus, Trash2, X } from 'lucide-react'

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [q, setQ] = useState('')
  const { success, error } = useToast()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })

  const filteredEmployees = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return employees
    return employees.filter((e) => {
      const hay = `${e.firstName} ${e.lastName} ${e.email}`.toLowerCase()
      return hay.includes(query)
    })
  }, [employees, q])

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/hr/employees')
      setEmployees(res.data.data.employees)
    } catch (err) {
      error('Failed to fetch employees')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/hr/employees', formData)
      success('Employee created')
      setShowModal(false)
      setFormData({ email: '', password: '', firstName: '', lastName: '' })
      fetchEmployees()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create employee')
    }
  }

  const handleDeactivate = async (employee) => {
    const confirmText = `${employee.firstName} ${employee.lastName}`
    if (!window.confirm(`Deactivate employee: ${confirmText}?`)) return
    try {
      await api.delete(`/hr/employees/${employee.id}`)
      success('Employee deactivated')
      fetchEmployees()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to deactivate employee')
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <div className="flex items-center gap-3">
          <input
            className="input w-full md:w-72"
            placeholder="Search name/email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Employee
          </button>
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
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.firstName} {emp.lastName}</td>
                    <td>{emp.email}</td>
                    <td>
                      <span className={`badge ${emp.isActive ? 'badge-green' : 'badge-red'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDeactivate(emp)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-red-600"
                        title="Deactivate"
                        disabled={!emp.isActive}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500">
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add Employee</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">First Name</label>
                <input
                  className="input"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Last Name</label>
                <input
                  className="input"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
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
                <button type="submit" className="btn-primary flex-1">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeManagement
