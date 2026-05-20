import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'

const links = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/quizzes', label: 'Quizzes', icon: '⚡' },
  { to: '/subjects', label: 'Subjects', icon: '📖' },
  { to: '/badges', label: 'Badges', icon: '🏅' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

export default function Sidebar() {
  const { profile } = useProfile()

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
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <h1 className="text-xl font-black text-white">Learn<span className="text-violet-500">XP</span></h1>
      </div>
      <div className="p-4 border-b border-gray-800">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center font-bold text-sm mb-2">
          {initials}
        </div>
        <p className="text-sm font-bold text-white">{profile?.name || 'Student'}</p>
        <p className="text-xs text-gray-400 mb-2">Level {profile?.level || 1} · {levelLabel}</p>
        <div className="bg-gray-800 rounded-full h-1.5">
          <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${xpPct}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1">{profile?.xp || 0} / {maxXP} XP</p>
      </div>
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${isActive
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
            }
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="mx-3 mb-2 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs font-semibold flex items-center gap-2">
        🔥 {profile?.streak || 0}-day streak!
      </div>
      <button
        onClick={handleLogout}
        className="mx-3 mb-4 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-semibold flex items-center gap-2 hover:bg-red-500/20 transition-all w-[calc(100%-24px)]"
      >
        🚪 Sign Out
      </button>
    </aside>
  )
}