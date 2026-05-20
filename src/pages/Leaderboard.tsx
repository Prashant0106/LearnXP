const players = [
  { name: 'Priya Sharma', school: 'IIT Bombay', xp: 5900, initials: 'PS', color: 'from-violet-500 to-purple-600' },
  { name: 'Rohan Mehta', school: 'BITS Pilani', xp: 5200, initials: 'RM', color: 'from-teal-500 to-cyan-600' },
  { name: 'Sneha Iyer', school: 'NIT Trichy', xp: 4800, initials: 'SI', color: 'from-orange-500 to-red-500' },
  { name: 'Prashant Gupta', school: 'VIT Pune', xp: 3400, initials: 'PG', color: 'from-yellow-500 to-amber-600', me: true },
  { name: 'Karan Patel', school: 'SRM Chennai', xp: 3100, initials: 'KP', color: 'from-pink-500 to-rose-600' },
  { name: 'Meera Nair', school: 'COEP Pune', xp: 2800, initials: 'MN', color: 'from-green-500 to-emerald-600' },
  { name: 'Dev Gupta', school: 'DTU Delhi', xp: 2400, initials: 'DG', color: 'from-blue-500 to-indigo-600' },
  { name: 'Anjali Reddy', school: 'IIIT Hyd', xp: 1900, initials: 'AR', color: 'from-fuchsia-500 to-purple-600' },
]

const rankLabel = (i: number) => {
  if (i === 0) return '🥇'
  if (i === 1) return '🥈'
  if (i === 2) return '🥉'
  return `#${i + 1}`
}

const maxXP = players[0].xp

export default function Leaderboard() {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-black mb-1 text-white">Leaderboard</h2>
      <p className="text-gray-400 text-sm mb-6">Top students this week · CS301 — Data Structures</p>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {players.slice(0, 3).map((p, i) => (
          <div key={p.name} className={`bg-gray-900 border rounded-2xl p-5 text-center ${i === 0 ? 'border-yellow-500/40' : 'border-gray-800'}`}>
            <div className="text-2xl mb-2">{rankLabel(i)}</div>
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center font-bold text-sm mx-auto mb-2`}>
              {p.initials}
            </div>
            <div className="font-bold text-sm mb-1">{p.name}</div>
            <div className="text-xs text-gray-500 mb-2">{p.school}</div>
            <div className="text-violet-400 font-mono font-bold text-sm">{p.xp.toLocaleString()} XP</div>
          </div>
        ))}
      </div>

      {/* Full list */}
      <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">All Rankings</div>
      <div className="flex flex-col gap-2">
        {players.map((p, i) => (
          <div
            key={p.name}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${p.me ? 'border-violet-500/40 bg-violet-500/5' : 'border-gray-800 bg-gray-900'}`}
          >
            <div className={`text-sm font-bold w-8 text-center font-mono ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
              {rankLabel(i)}
            </div>
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center font-bold text-xs flex-shrink-0`}>
              {p.initials}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold flex items-center gap-2">
                {p.name}
                {p.me && <span className="text-xs text-violet-400 font-mono bg-violet-500/10 px-2 py-0.5 rounded-full">YOU</span>}
              </div>
              <div className="text-xs text-gray-500">{p.school}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-violet-400 font-mono">{p.xp.toLocaleString()} XP</div>
              <div className="w-24 bg-gray-800 rounded-full h-1.5 mt-1">
                <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${(p.xp / maxXP) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}