import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

type Subject = {
  id: number
  name: string
  code: string
  color: string
  icon: string
  modules: string[]
}

type QuizScore = {
  score: number
  xp_earned: number
  played_at: string
}

const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const colorMap: Record<string, { bar: string; bg: string; text: string }> = {
  'bg-violet-500/10 border-violet-500/20 text-violet-400': { bar: 'bg-violet-500', bg: 'bg-violet-500/10 border-violet-500/20', text: 'text-violet-400' },
  'bg-teal-500/10 border-teal-500/20 text-teal-400': { bar: 'bg-teal-500', bg: 'bg-teal-500/10 border-teal-500/20', text: 'text-teal-400' },
  'bg-orange-500/10 border-orange-500/20 text-orange-400': { bar: 'bg-orange-500', bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400' },
  'bg-yellow-500/10 border-yellow-500/20 text-yellow-400': { bar: 'bg-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400' },
  'bg-pink-500/10 border-pink-500/20 text-pink-400': { bar: 'bg-pink-500', bg: 'bg-pink-500/10 border-pink-500/20', text: 'text-pink-400' },
  'bg-blue-500/10 border-blue-500/20 text-blue-400': { bar: 'bg-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400' },
}

export default function Dashboard() {
  const { profile } = useProfile()
  const navigate = useNavigate()
  const [hoveredCourse, setHoveredCourse] = useState<number | null>(null)
  const [quizCount, setQuizCount] = useState(0)
  const [badgeCount, setBadgeCount] = useState(0)
  const [weeklyXP, setWeeklyXP] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const [recentScores, setRecentScores] = useState<QuizScore[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [hasActivity, setHasActivity] = useState(false)

  useEffect(() => {
    loadDashboardData()
    loadSubjects()
  }, [])

  const loadSubjects = () => {
    try {
      const saved = localStorage.getItem('learnxp_subjects')
      if (saved) setSubjects(JSON.parse(saved))
    } catch { }
  }

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get quiz count
    const { count: quizzes } = await supabase
      .from('quiz_scores')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get badge count
    const { count: badges } = await supabase
      .from('badges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get weekly XP activity
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: scores } = await supabase
      .from('quiz_scores')
      .select('score, xp_earned, played_at')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })

    const weekly = [0, 0, 0, 0, 0, 0, 0]
    if (scores && scores.length > 0) {
      setHasActivity(true)
      setRecentScores(scores.slice(0, 5))
      scores.forEach(s => {
        const date = new Date(s.played_at)
        const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
        if (diff < 7) {
          const day = date.getDay()
          const index = day === 0 ? 6 : day - 1
          weekly[index] += s.xp_earned || 0
        }
      })
    }

    setQuizCount(quizzes || 0)
    setBadgeCount(badges || 0)
    setWeeklyXP(weekly)
    setLoading(false)
  }

  const maxWeeklyXP = Math.max(...weeklyXP, 1)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1

  const stats = [
    { icon: '⚡', label: 'Total XP', value: profile?.xp?.toLocaleString() || '0', color: 'text-violet-400', path: '/profile' },
    { icon: '🏅', label: 'Badges', value: badgeCount.toString(), color: 'text-yellow-400', path: '/badges' },
    { icon: '✓', label: 'Quizzes Done', value: quizCount.toString(), color: 'text-teal-400', path: '/quizzes' },
  ]

  return (
    <div className="w-full">
      <h2 className="text-2xl font-black mb-1 text-white">
        {greeting}, {profile?.name || 'Student'} 👋
      </h2>
      <p className="text-gray-400 text-sm mb-6">
        Level {profile?.level || 1} · {profile?.xp || 0} XP earned so far
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map(s => (
          <div
            key={s.label}
            onClick={() => navigate(s.path)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-violet-500/40 hover:-translate-y-0.5 transition-all"
          >
            <div className={`text-2xl mb-2 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-black mb-1 text-white">
              {loading ? '...' : s.value}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">{s.label}</div>
          </div>
        ))}
      </div>

      {/* XP Level Progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-white">Level {profile?.level || 1} Progress</span>
          <span className="text-xs text-violet-400 font-mono">{profile?.xp || 0} / {(profile?.level || 1) * 1000} XP</span>
        </div>
        <div className="bg-gray-800 rounded-full h-3 mb-1">
          <div
            className="bg-gradient-to-r from-violet-500 to-teal-400 h-3 rounded-full transition-all"
            style={{ width: `${Math.min(((profile?.xp || 0) / ((profile?.level || 1) * 1000)) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {((profile?.level || 1) * 1000) - (profile?.xp || 0)} XP to Level {(profile?.level || 1) + 1}
        </p>
      </div>

      {/* Subjects — only show if user has added subjects */}
      {subjects.length > 0 ? (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">My Subjects</div>
            <button onClick={() => navigate('/subjects')} className="text-xs text-violet-400 hover:text-violet-300 font-mono">
              Manage →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {subjects.slice(0, 4).map((s, i) => {
              const colors = colorMap[s.color] || { bar: 'bg-violet-500', bg: 'bg-violet-500/10 border-violet-500/20', text: 'text-violet-400' }
              return (
                <div
                  key={s.id}
                  onClick={() => navigate(`/subject/${s.code}`)}
                  className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all ${hoveredCourse === i ? 'border-violet-500/50 -translate-y-0.5' : 'border-gray-800'} hover:border-violet-500/50 hover:-translate-y-0.5`}
                  onMouseEnter={() => setHoveredCourse(i)}
                  onMouseLeave={() => setHoveredCourse(null)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{s.icon}</span>
                    <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text}`}>
                      {s.code}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mb-2">{s.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{s.modules.length} topics</div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-6 mb-6 text-center">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-sm font-bold text-white mb-1">No subjects added yet</div>
          <div className="text-xs text-gray-500 mb-3">Add your subjects to track them here</div>
          <button
            onClick={() => navigate('/subjects')}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all"
          >
            + Add Subjects
          </button>
        </div>
      )}

      {/* Weekly Activity — only show if user has taken quizzes */}
      {hasActivity ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm font-bold text-white">Weekly XP Activity</div>
              <div className="text-xs text-gray-500 font-mono">
                Total this week: {weeklyXP.reduce((a, b) => a + b, 0)} XP
              </div>
            </div>
            <button
              onClick={() => navigate('/progress')}
              className="text-xs text-violet-400 hover:text-violet-300 font-mono transition-all"
            >
              View Progress →
            </button>
          </div>
          <div className="flex items-end gap-2 h-20">
            {days.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                {weeklyXP[i] > 0 && (
                  <div className="text-xs text-gray-500 font-mono">{weeklyXP[i]}</div>
                )}
                <div
                  className={`w-full rounded-t transition-all ${i === todayIndex ? 'bg-violet-500' : weeklyXP[i] > 0 ? 'bg-violet-500/60' : 'bg-violet-500/20'}`}
                  style={{ height: `${Math.max((weeklyXP[i] / maxWeeklyXP) * 60, 4)}px` }}
                />
                <span className={`text-xs font-mono ${i === todayIndex ? 'text-violet-400 font-bold' : 'text-gray-600'}`}>
                  {day}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-6 mb-6 text-center">
          <div className="text-3xl mb-2">⚡</div>
          <div className="text-sm font-bold text-white mb-1">No quiz activity yet</div>
          <div className="text-xs text-gray-500 mb-3">Take a quiz to see your weekly activity here</div>
          <button
            onClick={() => navigate('/quizzes')}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all"
          >
            ⚡ Start a Quiz
          </button>
        </div>
      )}

      {/* Recent Quiz Activity — only show if has activity */}
      {hasActivity && recentScores.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-bold text-white">Recent Quiz Activity</div>
            <button onClick={() => navigate('/quizzes')} className="text-xs text-violet-400 hover:text-violet-300 font-mono">
              Play Again →
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recentScores.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-sm">⚡</div>
                  <div>
                    <div className="text-sm font-bold text-white">Quiz #{recentScores.length - i}</div>
                    <div className="text-xs text-gray-500 font-mono">
                      {new Date(s.played_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-violet-400 font-mono">+{s.xp_earned} XP</div>
                  <div className="text-xs text-gray-500 font-mono">Score: {s.score}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}