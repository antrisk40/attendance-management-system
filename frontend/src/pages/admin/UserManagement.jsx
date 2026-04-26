import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { Plus, Edit2, Loader2, X } from 'lucide-react'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const { success, error } = useToast()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'EMPLOYEE'
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/admin/users')
      setUsers(response.data.data.users)
    } catch (err) {
      error('Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await api.patch(`/admin/users/${editingUser.id}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          isActive: formData.isActive
        })
        success('User updated')
      } else {
        await api.post('/admin/users', formData)
        success('User created')
      }
      setShowModal(false)
      setEditingUser(null)
      setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'EMPLOYEE' })
      fetchUsers()
    } catch (err) {
      error(err.response?.data?.message || 'Operation failed')
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      isActive: user.isActive
    })
    setShowModal(true)
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge badge-blue">Admin</span>
      case 'HR':
        return <span className="badge badge-green">HR</span>
      case 'EMPLOYEE':
        return <span className="badge badge-gray">Employee</span>
      default:
        return <span className="badge badge-gray">{role}</span>
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={() => {
            setEditingUser(null)
            setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'EMPLOYEE' })
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add User
        </button>
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
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.email}</td>
                    <td>{getRoleBadge(user.role.name)}</td>
                    <td>
                      <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingUser ? 'Edit User' : 'Add User'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input"
                  required
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              )}

              {!editingUser && (
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input"
                    required={!editingUser}
                    minLength={6}
                  />
                </div>
              )}

              <div>
                <label className="label">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="HR">HR</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {editingUser && (
                <div>
                  <label className="label">Status</label>
                  <select
                    value={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="input"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
