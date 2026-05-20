import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'

const courses = [
  { code: 'CS301', name: 'Data Structures & Algorithms', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', bar: 'bg-violet-500', pct: 72, done: 18, total: 25 },
  { code: 'MATH202', name: 'Linear Algebra', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', bar: 'bg-teal-500', pct: 45, done: 9, total: 20 },
  { code: 'PHY101', name: 'Classical Mechanics', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', bar: 'bg-orange-500', pct: 88, done: 22, total: 25 },
  { code: 'ENG110', name: 'Technical Writing', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', bar: 'bg-yellow-500', pct: 30, done: 6, total: 20 },
]

const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const heights = [30, 45, 20, 55, 38, 52, 10]

export default function Dashboard() {
  const { profile } = useProfile()
  const navigate = useNavigate()
  const [hoveredCourse, setHoveredCourse] = useState<number | null>(null)

  const stats = [
    { icon: '⚡', label: 'Total XP', value: profile?.xp?.toLocaleString() || '0', color: 'text-violet-400', path: '/profile' },
    { icon: '🏅', label: 'Badges', value: '6', color: 'text-yellow-400', path: '/badges' },
    { icon: '✓', label: 'Quizzes Done', value: '24', color: 'text-teal-400', path: '/quizzes' },
  ]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="w-full">
      <h2 className="text-2xl font-black mb-1 text-white">{greeting}, {profile?.name || 'Student'} 👋</h2>
      <p className="text-gray-400 text-sm mb-6">You're 68% to your weekly goal. Keep going!</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map(s => (
          <div
            key={s.label}
            onClick={() => navigate(s.path)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-violet-500/40 hover:-translate-y-0.5 transition-all"
          >
            <div className={`text-2xl mb-2 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-black mb-1 text-white">{s.value}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Courses */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {courses.map((c, i) => (
          <div
            key={c.code}
            onClick={() => navigate(`/subject/${c.code}`)}
            className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all ${hoveredCourse === i ? 'border-violet-500/50 -translate-y-0.5' : 'border-gray-800'} hover:border-violet-500/50 hover:-translate-y-0.5`}
            onMouseEnter={() => setHoveredCourse(i)}
            onMouseLeave={() => setHoveredCourse(null)}
          >
            <span className={`text-xs font-mono font-semibold px-2 py-1 rounded-full border ${c.bg} ${c.color} mb-3 inline-block`}>
              {c.code}
            </span>
            <div className="text-sm font-bold mb-3 text-white">{c.name}</div>
            <div className="bg-gray-800 rounded-full h-1.5 mb-1.5">
              <div className={`h-1.5 rounded-full ${c.bar} transition-all`} style={{ width: `${c.pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 font-mono">
              <span>{c.pct}% complete</span>
              <span>{c.done}/{c.total} modules</span>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Activity */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">Weekly XP Activity</div>
          <button
            onClick={() => navigate('/progress')}
            className="text-xs text-violet-400 hover:text-violet-300 font-mono transition-all"
          >
            View Progress →
          </button>
        </div>
        <div className="flex items-end gap-2 h-16">
          {days.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t transition-all ${i === 5 ? 'bg-violet-500' : 'bg-violet-500/30'}`}
                style={{ height: `${heights[i]}px` }}
              />
              <span className={`text-xs font-mono ${i === 5 ? 'text-violet-400 font-bold' : 'text-gray-600'}`}>{day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}