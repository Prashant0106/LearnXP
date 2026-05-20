const badges = [
  { icon: '🔥', name: 'Hot Streak', desc: '7-day login streak', earned: true, date: 'Apr 29' },
  { icon: '⚡', name: 'Speed Demon', desc: 'Answer 5 Qs under 30s', earned: true, date: 'Apr 27' },
  { icon: '🎯', name: 'Sharpshooter', desc: '10 perfect quiz rounds', earned: true, date: 'Apr 24' },
  { icon: '📚', name: 'Bookworm', desc: 'Complete 3 courses', earned: true, date: 'Apr 20' },
  { icon: '🏆', name: 'Top 10', desc: 'Reach top 10 on leaderboard', earned: true, date: 'Apr 18' },
  { icon: '🌙', name: 'Night Owl', desc: 'Study after midnight', earned: true, date: 'Apr 10' },
  { icon: '🧠', name: 'Big Brain', desc: 'Score 100% on 3 quizzes', earned: false, date: null },
  { icon: '🚀', name: 'Launchpad', desc: 'Complete first 5000 XP', earned: false, date: null },
  { icon: '💎', name: 'Diamond', desc: '30-day streak', earned: false, date: null },
  { icon: '👑', name: 'Valedictorian', desc: 'Reach #1 on leaderboard', earned: false, date: null },
  { icon: '🌟', name: 'Star Student', desc: 'Complete all CS301 modules', earned: false, date: null },
  { icon: '🔬', name: 'Researcher', desc: 'Unlock all PHY101 content', earned: false, date: null },
]

export default function Badges() {
  const earned = badges.filter(b => b.earned)
  const locked = badges.filter(b => !b.earned)

  return (
    <div className="w-full">
      <h2 className="text-2xl font-black mb-1 text-white">Your Badges</h2>
      <p className="text-gray-400 text-sm mb-6">
        <span className="text-teal-400 font-bold">{earned.length} earned</span> · {locked.length} locked
      </p>

      {/* Earned badges */}
      <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Earned</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {earned.map(b => (
          <div key={b.name} className="bg-gray-900 border border-gray-800 hover:border-violet-500/40 rounded-2xl p-5 text-center transition-all hover:-translate-y-0.5">
            <div className="text-4xl mb-3">{b.icon}</div>
            <div className="font-bold text-sm mb-1">{b.name}</div>
            <div className="text-xs text-gray-400 mb-2">{b.desc}</div>
            <div className="text-xs text-teal-400 font-mono">Earned {b.date}</div>
          </div>
        ))}
      </div>

      {/* Locked badges */}
      <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Locked</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {locked.map(b => (
          <div key={b.name} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center opacity-40 grayscale">
            <div className="text-4xl mb-3">{b.icon}</div>
            <div className="font-bold text-sm mb-1">{b.name}</div>
            <div className="text-xs text-gray-400 mb-2">{b.desc}</div>
            <div className="text-xs text-gray-600 font-mono">🔒 Locked</div>
          </div>
        ))}
      </div>
    </div>
  )
}