import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'

type QuizScore = {
  score: number
  xp_earned: number
  played_at: string
}

type DayData = {
  day: string
  xp: number
  quizzes: number
}

export default function Analytics() {
  const { profile } = useProfile()
  const [scores, setScores] = useState<QuizScore[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week')

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('quiz_scores')
      .select('score, xp_earned, played_at')
      .eq('user_id', user.id)
      .order('played_at', { ascending: true })

    setScores(data || [])
    setLoading(false)
  }

  const getFilteredScores = () => {
    const now = new Date()
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return scores.filter(s => new Date(s.played_at) >= weekAgo)
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return scores.filter(s => new Date(s.played_at) >= monthAgo)
    }
    return scores
  }

  const filteredScores = getFilteredScores()

  const totalXP = filteredScores.reduce((a, s) => a + (s.xp_earned || 0), 0)
  const totalQuizzes = filteredScores.length
  const avgScore = filteredScores.length > 0
    ? Math.round(filteredScores.reduce((a, s) => a + (s.score || 0), 0) / filteredScores.length * 10) / 10
    : 0
  const bestScore = filteredScores.length > 0
    ? Math.max(...filteredScores.map(s => s.score || 0))
    : 0
  const totalXPAllTime = scores.reduce((a, s) => a + (s.xp_earned || 0), 0)

  // Build daily data for chart
  const getDailyData = (): DayData[] => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 14
    const result: DayData[] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const dayScores = scores.filter(s => s.played_at.startsWith(dateStr))
      result.push({
        day: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        xp: dayScores.reduce((a, s) => a + (s.xp_earned || 0), 0),
        quizzes: dayScores.length,
      })
    }
    return result
  }

  const dailyData = getDailyData()
  const maxXP = Math.max(...dailyData.map(d => d.xp), 1)

  // XP over time for line chart
  const getXPOverTime = () => {
    let cumulative = 0
    return filteredScores.map(s => {
      cumulative += s.xp_earned || 0
      return {
        date: new Date(s.played_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        xp: cumulative,
      }
    })
  }

  const xpOverTime = getXPOverTime()
  const maxCumXP = xpOverTime.length > 0 ? Math.max(...xpOverTime.map(d => d.xp), 1) : 1

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <div className="text-violet-400 animate-pulse font-mono">Loading analytics...</div>
      </div>
    )
  }

  if (scores.length === 0) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-black text-white mb-1">Performance Analytics 📊</h2>
        <p className="text-gray-400 text-sm mb-6">Track your learning progress over time</p>
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <div className="text-white font-bold text-xl mb-2">No data yet!</div>
          <div className="text-gray-400 text-sm">Complete some quizzes to see your analytics here</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-black text-white mb-1">Performance Analytics 📊</h2>
      <p className="text-gray-400 text-sm mb-6">Track your learning progress over time</p>

      {/* Period selector */}
      <div className="flex gap-2 mb-6">
        {(['week', 'month', 'all'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize ${period === p
              ? 'bg-violet-600 text-white'
              : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            {p === 'week' ? 'Last 7 days' : p === 'month' ? 'Last 30 days' : 'All time'}
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: '⚡', label: 'XP Earned', value: totalXP.toLocaleString(), color: 'text-violet-400' },
          { icon: '🎮', label: 'Quizzes', value: totalQuizzes, color: 'text-teal-400' },
          { icon: '🎯', label: 'Avg Score', value: avgScore, color: 'text-yellow-400' },
          { icon: '🏆', label: 'Best Score', value: bestScore, color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className={`text-xl mb-1 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-black text-white mb-1">{s.value}</div>
            <div className="text-xs text-gray-500 uppercase font-mono">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Daily XP bar chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold text-white">Daily XP Activity</div>
          <div className="text-xs text-gray-500 font-mono">Total: {totalXP} XP</div>
        </div>
        <div className="flex items-end gap-1" style={{ height: '80px' }}>
          {dailyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              {d.xp > 0 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded font-mono opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-10">
                  {d.xp} XP
                </div>
              )}
              <div
                className={`w-full rounded-t transition-all ${d.xp > 0 ? 'bg-violet-500' : 'bg-violet-500/15'}`}
                style={{ height: `${Math.max((d.xp / maxXP) * 70, 3)}px` }}
              />
              {dailyData.length <= 14 && (
                <span className="text-xs font-mono text-gray-600 truncate w-full text-center" style={{ fontSize: '9px' }}>
                  {d.day.split(' ')[0]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* XP Growth line chart */}
      {xpOverTime.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <div className="text-sm font-bold text-white mb-4">XP Growth Over Time</div>
          <div className="relative" style={{ height: '100px' }}>
            <svg width="100%" height="100" viewBox={`0 0 ${xpOverTime.length * 40} 100`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C5CFC" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#7C5CFC" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="#7C5CFC"
                strokeWidth="2"
                points={xpOverTime.map((d, i) =>
                  `${i * 40 + 20},${100 - (d.xp / maxCumXP) * 90}`
                ).join(' ')}
              />
              <polygon
                fill="url(#xpGrad)"
                points={[
                  ...xpOverTime.map((d, i) => `${i * 40 + 20},${100 - (d.xp / maxCumXP) * 90}`),
                  `${(xpOverTime.length - 1) * 40 + 20},100`,
                  `20,100`
                ].join(' ')}
              />
              {xpOverTime.map((d, i) => (
                <circle key={i} cx={i * 40 + 20} cy={100 - (d.xp / maxCumXP) * 90} r="3" fill="#7C5CFC" />
              ))}
            </svg>
          </div>
          <div className="flex justify-between text-xs text-gray-600 font-mono mt-1">
            <span>{xpOverTime[0]?.date}</span>
            <span>{xpOverTime[xpOverTime.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Recent quiz history */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="text-sm font-bold text-white mb-4">Recent Quiz History</div>
        <div className="flex flex-col gap-2">
          {filteredScores.slice().reverse().slice(0, 10).map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-sm">🎮</div>
                <div>
                  <div className="text-sm font-bold text-white">Quiz #{filteredScores.length - i}</div>
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

      {/* All time stats */}
      <div className="mt-6 bg-gray-900 border border-violet-500/20 rounded-2xl p-5">
        <div className="text-xs text-violet-400 uppercase tracking-wider font-mono mb-3">All Time Stats</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-black text-white">{profile?.level || 1}</div>
            <div className="text-xs text-gray-500 font-mono uppercase">Current Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-white">{totalXPAllTime.toLocaleString()}</div>
            <div className="text-xs text-gray-500 font-mono uppercase">Total XP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-white">{profile?.streak || 0}</div>
            <div className="text-xs text-gray-500 font-mono uppercase">Day Streak</div>
          </div>
        </div>
      </div>
    </div>
  )
}