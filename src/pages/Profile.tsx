import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { showToast } from '../components/Toast'

export default function Profile() {
  const { profile } = useProfile()
  const [name, setName] = useState(profile?.name || '')
  const [saving, setSaving] = useState(false)

  const levelLabels = ['Beginner', 'Student', 'Scholar', 'Expert', 'Master', 'Legend']
  const levelLabel = levelLabels[Math.min((profile?.level || 1) - 1, levelLabels.length - 1)]
  const maxXP = (profile?.level || 1) * 1000
  const xpPct = profile ? Math.min((profile.xp / maxXP) * 100, 100) : 0
  const initials = profile?.name?.slice(0, 2).toUpperCase() || 'ST'

  const handleSave = async () => {
    if (!profile || !name.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', profile.id)
    if (error) {
      showToast('Failed to save profile!', 'error')
    } else {
      showToast('Profile updated successfully!', 'success')
    }
    setSaving(false)
  }

  const stats = [
    { icon: '⚡', label: 'Total XP', value: profile?.xp?.toLocaleString() || '0', color: 'text-violet-400' },
    { icon: '🏅', label: 'Level', value: `${profile?.level || 1}`, color: 'text-yellow-400' },
    { icon: '🔥', label: 'Streak', value: `${profile?.streak || 0} days`, color: 'text-orange-400' },
  ]

  return (
    <div className="w-full">
      <h2 className="text-2xl font-black mb-1 text-white">Your Profile</h2>
      <p className="text-gray-400 text-sm mb-6">Manage your account and view your stats</p>

      {/* Profile card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center font-black text-xl text-white">
            {initials}
          </div>
          <div>
            <div className="text-xl font-black text-white">{profile?.name || 'Student'}</div>
            <div className="text-gray-400 text-sm">Level {profile?.level || 1} · {levelLabel}</div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white font-semibold">XP Progress</span>
            <span className="text-violet-400 font-mono font-bold">{profile?.xp || 0} / {maxXP} XP</span>
          </div>
          <div className="bg-gray-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-violet-500 to-teal-400 h-3 rounded-full transition-all"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{maxXP - (profile?.xp || 0)} XP to next level</p>
        </div>

        {/* Edit name */}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider font-mono mb-2 block">Display Name</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
              placeholder="Enter your name"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold px-5 py-3 rounded-xl transition-all"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className={`text-2xl mb-2 ${s.color}`}>{s.icon}</div>
            <div className="text-xl font-black mb-1 text-white">{s.value}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-6">
        <div className="text-xs text-red-400 uppercase tracking-wider font-mono mb-3">Danger Zone</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white">Sign out of LearnXP</div>
            <div className="text-xs text-gray-400">You can sign back in anytime</div>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold px-4 py-2 rounded-xl text-sm transition-all"
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}