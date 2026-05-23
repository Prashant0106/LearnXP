import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Badge = {
  id: string
  name: string
  icon: string
  earned_at: string
}

const allBadges = [
  { name: 'First Steps', icon: '⚡', desc: 'Earn your first 1,000 XP', threshold: '1,000 XP' },
  { name: 'XP Hunter', icon: '🎯', desc: 'Earn 5,000 XP total', threshold: '5,000 XP' },
  { name: 'Scholar', icon: '📚', desc: 'Earn 10,000 XP total', threshold: '10,000 XP' },
  { name: 'Launchpad', icon: '🚀', desc: 'Earn 50,000 XP total', threshold: '50,000 XP' },
  { name: 'On Fire', icon: '🔥', desc: 'Maintain a 7-day streak', threshold: '7-day streak' },
  { name: 'Hot Streak', icon: '🌟', desc: 'Maintain a 22-day streak', threshold: '22-day streak' },
  { name: 'First Quiz', icon: '🎮', desc: 'Complete your first quiz', threshold: '1 quiz' },
  { name: 'Quiz Addict', icon: '🏅', desc: 'Complete 10 quizzes', threshold: '10 quizzes' },
  { name: 'Quiz Master', icon: '🏆', desc: 'Complete 50 quizzes', threshold: '50 quizzes' },
]

export default function Badges() {
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBadges()
  }, [])

  const loadBadges = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('badges')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })

    setEarnedBadges(data || [])
    setLoading(false)
  }

  const earnedNames = earnedBadges.map(b => b.name)
  const lockedBadges = allBadges.filter(b => !earnedNames.includes(b.name))

  return (
    <div className="w-full">
      <h2 className="text-2xl font-black mb-1 text-white">Your Badges</h2>
      <p className="text-gray-400 text-sm mb-6">
        <span className="text-teal-400 font-bold">{earnedBadges.length} earned</span> · {lockedBadges.length} locked
      </p>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-violet-400 animate-pulse font-mono text-sm">Loading badges...</div>
        </div>
      ) : (
        <>
          {/* Earned badges */}
          {earnedBadges.length > 0 && (
            <>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Earned</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {earnedBadges.map(b => (
                  <div key={b.id} className="bg-gray-900 border border-gray-800 hover:border-violet-500/40 rounded-2xl p-5 text-center transition-all hover:-translate-y-0.5">
                    <div className="text-4xl mb-3">{b.icon}</div>
                    <div className="font-bold text-sm text-white mb-1">{b.name}</div>
                    <div className="text-xs text-gray-400 mb-2">
                      {allBadges.find(ab => ab.name === b.name)?.desc || ''}
                    </div>
                    <div className="text-xs text-teal-400 font-mono">
                      Earned {new Date(b.earned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* No badges yet */}
          {earnedBadges.length === 0 && (
            <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-8 text-center mb-8">
              <div className="text-4xl mb-3">🏅</div>
              <div className="text-white font-bold mb-1">No badges yet!</div>
              <div className="text-gray-400 text-sm">Complete quizzes and earn XP to unlock badges</div>
            </div>
          )}

          {/* Locked badges */}
          <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Locked</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {lockedBadges.map(b => (
              <div key={b.name} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center opacity-40 grayscale">
                <div className="text-4xl mb-3">{b.icon}</div>
                <div className="font-bold text-sm text-white mb-1">{b.name}</div>
                <div className="text-xs text-gray-400 mb-2">{b.desc}</div>
                <div className="text-xs text-gray-500 font-mono">🔒 {b.threshold}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}