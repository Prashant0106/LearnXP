import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'

const links = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/quizzes', label: 'Quizzes', icon: '⚡' },
  { to: '/subjects', label: 'Subjects', icon: '📖' },
  { to: '/daily', label: 'Daily Challenge', icon: '🎯' },
  { to: '/multiplayer', label: 'Multiplayer', icon: '🎮' },
  { to: '/flashcards', label: 'Flashcards', icon: '🃏' },
  { to: '/notes', label: 'Notes', icon: '📝' },
  { to: '/analytics', label: 'Analytics', icon: '📊' },
  { to: '/planner', label: 'Study Planner', icon: '📅' },
  { to: '/timer', label: 'Study Timer', icon: '⏱️' },
  { to: '/badges', label: 'Badges', icon: '🏅' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/friends', label: 'Friends', icon: '👥' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

export default function Sidebar() {
  const { profile } = useProfile()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const maxXP = profile ? profile.level * 1000 : 1000
  const xpPct = profile ? Math.min((profile.xp / maxXP) * 100, 100) : 0
  const initials = profile?.name?.slice(0, 2).toUpperCase() || 'ST'
  const levelLabels = ['Beginner', 'Student', 'Scholar', 'Expert', 'Master', 'Legend']
  const levelLabel = levelLabels[Math.min((profile?.level || 1) - 1, levelLabels.length - 1)]

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-56'} bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 flex-shrink-0 overflow-hidden`}
      style={{ scrollbarColor: '#1f2937 #111827', scrollbarWidth: 'thin' }}
    >
      {/* Header with toggle */}
      <div className={`flex items-center ${collapsed ? 'justify-center p-3' : 'justify-between p-4'} border-b border-gray-800 flex-shrink-0`}>
        {!collapsed && (
          <h1 className="text-xl font-black text-white">
            Learn<span className="text-violet-500">XP</span>
          </h1>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all flex-shrink-0"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Profile section */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{profile?.name || 'Student'}</p>
              <p className="text-xs text-gray-400">Level {profile?.level || 1} · {levelLabel}</p>
            </div>
          </div>
          <div className="bg-gray-800 rounded-full h-1.5">
            <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${xpPct}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{profile?.xp || 0} / {maxXP} XP</p>
        </div>
      )}

      {/* Collapsed avatar */}
      {collapsed && (
        <div className="flex justify-center py-3 border-b border-gray-800 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center font-bold text-sm">
            {initials}
          </div>
        </div>
      )}

      {/* Nav links - scrollable */}
      <nav
        className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto"
        style={{ scrollbarColor: '#1f2937 #111827', scrollbarWidth: 'thin' }}
      >
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            title={collapsed ? link.label : undefined}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg text-sm font-medium transition-all
              ${isActive
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent'}`
            }
          >
            <span className="text-base flex-shrink-0">{link.icon}</span>
            {!collapsed && <span className="truncate">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-2 flex-shrink-0 border-t border-gray-800">
        {!collapsed && (
          <div className="mx-1 mb-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs font-semibold flex items-center gap-2">
            🔥 {profile?.streak || 0}-day streak!
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center mb-2" title={`${profile?.streak || 0}-day streak`}>
            <span className="text-lg">🔥</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`${collapsed ? 'justify-center px-2' : 'px-3 gap-2'} w-full flex items-center py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all`}
        >
          <span>🚪</span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}