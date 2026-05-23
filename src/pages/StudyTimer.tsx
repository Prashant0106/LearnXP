import { useState, useEffect, useRef } from 'react'
import { useProfile } from '../hooks/useProfile'
import { showToast } from '../components/Toast'
import confetti from 'canvas-confetti'

type Mode = 'focus' | 'short' | 'long'

const modes = {
  focus: { label: 'Focus', duration: 25 * 60, color: 'text-violet-400', bg: 'bg-violet-500', border: 'border-violet-500/30', xp: 50 },
  short: { label: 'Short Break', duration: 5 * 60, color: 'text-teal-400', bg: 'bg-teal-500', border: 'border-teal-500/30', xp: 0 },
  long: { label: 'Long Break', duration: 15 * 60, color: 'text-blue-400', bg: 'bg-blue-500', border: 'border-blue-500/30', xp: 0 },
}

export default function StudyTimer() {
  const { addXP } = useProfile()
  const [mode, setMode] = useState<Mode>('focus')
  const [timeLeft, setTimeLeft] = useState(modes.focus.duration)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [totalXP, setTotalXP] = useState(0)
  const [customMinutes, setCustomMinutes] = useState(25)
  const [subject, setSubject] = useState('')
  const [completedSessions, setCompletedSessions] = useState<{ mode: string; subject: string; xp: number; time: string }[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            handleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current!)
    }
    return () => clearInterval(intervalRef.current!)
  }, [running, mode])

  const handleComplete = async () => {
    const current = modes[mode]
    if (mode === 'focus') {
      const earned = current.xp
      setSessions(s => s + 1)
      setTotalXP(x => x + earned)
      await addXP(earned)
      showToast(`Focus session complete! +${earned} XP 🎉`, 'success')
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#7C5CFC', '#00D4AA'] })
      setCompletedSessions(prev => [{
        mode: 'Focus',
        subject: subject || 'General Study',
        xp: earned,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      }, ...prev.slice(0, 9)])
    } else {
      showToast('Break complete! Ready to focus? 💪', 'info')
    }
  }

  const handleModeChange = (m: Mode) => {
    setMode(m)
    setTimeLeft(modes[m].duration)
    setRunning(false)
    clearInterval(intervalRef.current!)
  }

  const handleReset = () => {
    setRunning(false)
    setTimeLeft(mode === 'focus' ? customMinutes * 60 : modes[mode].duration)
    clearInterval(intervalRef.current!)
  }

  const handleCustomTime = (mins: number) => {
    setCustomMinutes(mins)
    if (mode === 'focus') setTimeLeft(mins * 60)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const current = modes[mode]
  const totalDuration = mode === 'focus' ? customMinutes * 60 : modes[mode].duration
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100
  const circumference = 2 * Math.PI * 120

  return (
    <div className="w-full">
      <h2 className="text-2xl font-black text-white mb-1">Study Timer ⏱️</h2>
      <p className="text-gray-400 text-sm mb-6">Focus sessions earn XP — stay consistent!</p>

      <div className="grid grid-cols-3 gap-6">
        {/* Timer */}
        <div className="col-span-2">
          {/* Mode selector */}
          <div className="flex gap-2 mb-6">
            {(Object.keys(modes) as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === m
                  ? `${modes[m].bg} text-white`
                  : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'
                }`}
              >
                {modes[m].label}
              </button>
            ))}
          </div>

          {/* Subject input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="What are you studying? (optional)"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
            />
          </div>

          {/* Timer circle */}
          <div className="flex justify-center mb-6">
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="absolute" width="264" height="264" viewBox="0 0 264 264">
                <circle cx="132" cy="132" r="120" fill="none" stroke="#1f2937" strokeWidth="8" />
                <circle
                  cx="132" cy="132" r="120"
                  fill="none"
                  stroke={mode === 'focus' ? '#7C5CFC' : mode === 'short' ? '#00D4AA' : '#3B82F6'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progress / 100) * circumference}
                  transform="rotate(-90 132 132)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="text-center z-10">
                <div className={`text-5xl font-black font-mono ${current.color}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className="text-gray-400 text-sm mt-1">{current.label}</div>
                {mode === 'focus' && (
                  <div className="text-xs text-violet-400 font-mono mt-1">+{current.xp} XP on complete</div>
                )}
              </div>
            </div>
          </div>

          {/* Custom time for focus mode */}
          {mode === 'focus' && !running && (
            <div className="mb-6">
              <label className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-2 block">Focus Duration</label>
              <div className="flex gap-2 flex-wrap">
                {[15, 25, 30, 45, 60].map(m => (
                  <button
                    key={m}
                    onClick={() => handleCustomTime(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${customMinutes === m
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
                    }`}
                  >
                    {m} min
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={customMinutes}
                  onChange={e => handleCustomTime(Math.min(120, Math.max(1, parseInt(e.target.value) || 25)))}
                  className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white text-center outline-none focus:border-violet-500"
                />
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={() => setRunning(r => !r)}
              className={`flex-1 ${running ? 'bg-gray-700 hover:bg-gray-600' : 'bg-violet-600 hover:bg-violet-700'} text-white font-black py-3 rounded-xl transition-all text-sm`}
            >
              {running ? '⏸ Pause' : timeLeft === totalDuration ? '▶ Start' : '▶ Resume'}
            </button>
            <button
              onClick={handleReset}
              className="px-5 py-3 bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white font-bold rounded-xl transition-all text-sm"
            >
              ↺ Reset
            </button>
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="flex flex-col gap-4">
          {/* Session stats */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Today's Stats</div>
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-2xl font-black text-violet-400">{sessions}</div>
                <div className="text-xs text-gray-500 font-mono">Sessions done</div>
              </div>
              <div>
                <div className="text-2xl font-black text-teal-400">{sessions * customMinutes}</div>
                <div className="text-xs text-gray-500 font-mono">Minutes focused</div>
              </div>
              <div>
                <div className="text-2xl font-black text-yellow-400">+{totalXP}</div>
                <div className="text-xs text-gray-500 font-mono">XP earned</div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">💡 Tips</div>
            <div className="flex flex-col gap-2 text-xs text-gray-400">
              <p>📵 Put your phone away during focus sessions</p>
              <p>💧 Stay hydrated during breaks</p>
              <p>🎯 Set a goal before each session</p>
              <p>🔥 4 focus sessions = 1 long break</p>
            </div>
          </div>
        </div>
      </div>

      {/* Session history */}
      {completedSessions.length > 0 && (
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Session History</div>
          <div className="flex flex-col gap-2">
            {completedSessions.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-sm">⏱️</div>
                  <div>
                    <div className="text-sm font-bold text-white">{s.subject}</div>
                    <div className="text-xs text-gray-500 font-mono">{s.time}</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-violet-400 font-mono">+{s.xp} XP</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}