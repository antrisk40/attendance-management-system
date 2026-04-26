import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { Loader2 } from 'lucide-react'

const CompanySettings = () => {
  const [settings, setSettings] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { success, error } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings')
      setSettings(response.data.data || {
        workStartTime: '09:00',
        workEndTime: '18:00',
        gracePeriodMin: 15,
        halfDayAfterMin: 240,
        fullDayHours: 8,
        timezone: 'Asia/Kolkata'
      })
    } catch (err) {
      error('Failed to fetch settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await api.patch('/admin/settings', settings)
      success('Settings updated')
    } catch (err) {
      error('Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Company Settings</h1>

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Work Start Time</label>
              <input
                type="time"
                value={settings?.workStartTime || '09:00'}
                onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Work End Time</label>
              <input
                type="time"
                value={settings?.workEndTime || '18:00'}
                onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Grace Period (minutes)</label>
              <input
                type="number"
                value={settings?.gracePeriodMin || 15}
                onChange={(e) => setSettings({ ...settings, gracePeriodMin: parseInt(e.target.value) })}
                className="input"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Late arrival allowed before marking</p>
            </div>

            <div>
              <label className="label">Half Day After (minutes)</label>
              <input
                type="number"
                value={settings?.halfDayAfterMin || 240}
                onChange={(e) => setSettings({ ...settings, halfDayAfterMin: parseInt(e.target.value) })}
                className="input"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Minutes before marking half day</p>
            </div>

            <div>
              <label className="label">Full Day Hours</label>
              <input
                type="number"
                step="0.5"
                value={settings?.fullDayHours || 8}
                onChange={(e) => setSettings({ ...settings, fullDayHours: parseFloat(e.target.value) })}
                className="input"
                min="0"
                max="24"
              />
            </div>

            <div>
              <label className="label">Timezone</label>
              <select
                value={settings?.timezone || 'Asia/Kolkata'}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="input"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex items-center gap-2"
            >
              {isSaving && <Loader2 className="animate-spin" size={16} />}
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CompanySettings
