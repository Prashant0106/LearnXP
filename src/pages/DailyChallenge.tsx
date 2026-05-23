import { useState, useEffect } from 'react'
import { useProfile } from '../hooks/useProfile'
import { showToast } from '../components/Toast'
import { supabase } from '../lib/supabase'
import confetti from 'canvas-confetti'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
})

type Question = {
  q: string
  opts: string[]
  ans: number
  exp: string
}

const dailyTopics = [
  'Data Structures', 'Indian History', 'Python Programming',
  'Mathematics', 'General Science', 'World Geography',
  'Computer Networks', 'Organic Chemistry', 'English Grammar',
  'Economics', 'Physics', 'Biology', 'Machine Learning',
  'World History', 'Statistics'
]

const getTodayTopic = () => {
  const day = new Date().getDay()
  const date = new Date().getDate()
  return dailyTopics[(day + date) % dailyTopics.length]
}

const getTodayKey = () => `learnxp_daily_${new Date().toISOString().split('T')[0]}`

export default function DailyChallenge() {
  const { addXP } = useProfile()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [xp, setXp] = useState(0)
  const [finished, setFinished] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  const todayTopic = getTodayTopic()
  const bonusXP = 200
  const [selectedTopic, setSelectedTopic] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [numChallengeQuestions, setNumChallengeQuestions] = useState(5)

  useEffect(() => {
    // Check if already completed today
    const done = localStorage.getItem(getTodayKey())
    if (done) setAlreadyDone(true)

    // Calculate time left until midnight
    const now = new Date()
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    setTimeLeft(Math.floor((midnight.getTime() - now.getTime()) / 1000))

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const generateChallenge = async () => {
    setLoading(true)
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Generate ${numChallengeQuestions} challenging multiple choice questions about "${selectedTopic || todayTopic}" for a daily challenge.
Return ONLY a valid JSON array:
[{"q": "Question?", "opts": ["A", "B", "C", "D"], "ans": 1, "exp": "Explanation"}]
The "ans" field is the index (0-3) of the correct option.`
        }],
        temperature: 0.8,
        max_tokens: 1500,
      })
      const text = response.choices[0]?.message?.content || ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Invalid format')
      setQuestions(JSON.parse(jsonMatch[0]))
      setStarted(true)
    } catch {
      showToast('Failed to generate challenge. Try again!', 'error')
    }
    setLoading(false)
  }

  const handleSelect = (i: number) => {
    if (answered) return
    setSelected(i)
    setAnswered(true)
    const q = questions[index]
    if (i === q.ans) {
      setScore(s => s + 1)
      setXp(x => x + 50)
      showToast('+50 XP earned!', 'xp')
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#7C5CFC', '#00D4AA'] })
    } else {
      showToast('Not quite! Keep going 💪', 'error')
    }
  }

  const handleNext = async () => {
    if (index < questions.length - 1) {
      setIndex(i => i + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      setFinished(true)
      const totalXP = xp + bonusXP
      await addXP(totalXP)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('quiz_scores').insert({
          user_id: user.id,
          score,
          xp_earned: totalXP,
          played_at: new Date().toISOString()
        })
      }

      localStorage.setItem(getTodayKey(), JSON.stringify({ score, xp: totalXP, topic: todayTopic }))
      showToast(`Daily Challenge complete! +${totalXP} XP!`, 'success')
      confetti({ particleCount: 300, spread: 120, origin: { y: 0.6 }, colors: ['#7C5CFC', '#00D4AA', '#F5B731', '#FF7B5C'] })
    }
  }

  const getOptionClass = (i: number) => {
    const q = questions[index]
    if (!answered) return 'border-gray-700 bg-gray-800 hover:border-violet-500/50 hover:bg-violet-500/5 cursor-pointer'
    if (i === q.ans) return 'border-teal-500 bg-teal-500/10 cursor-default'
    if (i === selected && i !== q.ans) return 'border-red-500 bg-red-500/10 cursor-default'
    return 'border-gray-700 bg-gray-800 opacity-50 cursor-default'
  }

  // Already completed today
  if (alreadyDone) {
    const saved = JSON.parse(localStorage.getItem(getTodayKey()) || '{}')
    return (
      <div className="w-full">
        <h2 className="text-2xl font-black text-white mb-1">Daily Challenge</h2>
        <p className="text-gray-400 text-sm mb-6">One challenge per day — come back tomorrow!</p>
        <div className="bg-gray-900 border border-teal-500/30 rounded-2xl p-8 text-center max-w-md mx-auto">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-black text-white mb-2">Already completed today!</h3>
          <p className="text-gray-400 text-sm">Topic: <span className="text-violet-400 font-semibold">{selectedTopic || todayTopic}</span></p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-2xl font-black text-teal-400">{saved.score}/5</div>
              <div className="text-xs text-gray-500 font-mono uppercase">Score</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-2xl font-black text-violet-400">+{saved.xp}</div>
              <div className="text-xs text-gray-500 font-mono uppercase">XP Earned</div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-500 font-mono uppercase mb-1">Next challenge in</div>
            <div className="text-2xl font-black text-yellow-400 font-mono">{formatTime(timeLeft)}</div>
          </div>
        </div>
      </div>
    )
  }

  // Finished screen
  if (finished) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center max-w-md w-full">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-white mb-2">Challenge Complete!</h2>
          <p className="text-gray-400 mb-6">Topic: <span className="text-violet-400 font-bold">{todayTopic}</span></p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-2xl font-black text-teal-400">{score}/5</div>
              <div className="text-xs text-gray-500 font-mono uppercase">Score</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-2xl font-black text-violet-400">+{xp}</div>
              <div className="text-xs text-gray-500 font-mono uppercase">Quiz XP</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-2xl font-black text-yellow-400">+{bonusXP}</div>
              <div className="text-xs text-gray-500 font-mono uppercase">Bonus XP</div>
            </div>
          </div>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mb-6">
            <div className="text-sm text-violet-400 font-bold">Total XP Earned: +{xp + bonusXP}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-500 font-mono uppercase mb-1">Next challenge in</div>
            <div className="text-2xl font-black text-yellow-400 font-mono">{formatTime(timeLeft)}</div>
          </div>
        </div>
      </div>
    )
  }

  // Quiz in progress
  if (started && questions.length > 0) {
    const q = questions[index]
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">Daily Challenge</h2>
            <p className="text-gray-400 text-sm">Topic: <span className="text-violet-400 font-semibold">{todayTopic}</span></p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-yellow-400 font-mono uppercase">Bonus XP</div>
            <div className="text-lg font-black text-yellow-400">+{bonusXP}</div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-xs font-mono text-gray-500">Q {index + 1} / {questions.length}</span>
          <div className="flex-1 bg-gray-800 rounded-full h-2">
            <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
          </div>
          <span className="text-xs font-mono text-violet-400">Score: {score}</span>
        </div>

        {/* Question */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
          <p className="text-base font-bold leading-relaxed mb-6 text-white">{q.q}</p>
          <div className="flex flex-col gap-3">
            {q.opts.map((opt, i) => (
              <div
                key={i}
                onClick={() => handleSelect(i)}
                className={`px-4 py-3 rounded-xl border text-sm transition-all text-white ${getOptionClass(i)}`}
              >
                <span className="font-mono text-gray-400 mr-3">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </div>
            ))}
          </div>
        </div>

        {answered && (
          <div className={`px-4 py-3 rounded-xl text-sm mb-4 ${selected === q.ans ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            {selected === q.ans ? '✓ Correct! ' : '✗ Not quite. '}{q.exp}
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!answered}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-all"
        >
          {index < questions.length - 1 ? 'Next →' : 'Finish Challenge 🎯'}
        </button>
      </div>
    )
  }

  // Landing screen
  return (
    <div className="w-full">
      <h2 className="text-2xl font-black text-white mb-1">Daily Challenge 🎯</h2>
      <p className="text-gray-400 text-sm mb-6">One special challenge every day — earn bonus XP!</p>

      <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-yellow-400 font-mono uppercase tracking-wider mb-1">Today's Challenge</div>
            <div className="text-2xl font-black text-white">{selectedTopic || todayTopic}</div>
          </div>
          <div className="text-4xl">🎯</div>
        </div>

        {/* Subject selector */}
        <div className="mb-5">
          <label className="text-xs text-gray-400 font-mono mb-2 block uppercase tracking-wider">Choose Your Topic</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {dailyTopics.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTopic(t)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${selectedTopic === t
                  ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-yellow-500/30 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Custom topic input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Or type any custom topic..."
              value={customTopic}
              onChange={e => {
                setCustomTopic(e.target.value)
                if (e.target.value.trim()) setSelectedTopic(e.target.value.trim())
              }}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-yellow-500"
            />
            {customTopic && (
              <button
                onClick={() => { setCustomTopic(''); setSelectedTopic('') }}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 hover:text-white text-sm transition-all"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Question count selector */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 font-mono mb-2 block uppercase tracking-wider">Number of Questions</label>
          <div className="flex gap-2 flex-wrap">
            {[5, 10, 15, 20].map(n => (
              <button
                key={n}
                onClick={() => setNumChallengeQuestions(n)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${numChallengeQuestions === n
                  ? 'bg-yellow-500 text-gray-900'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-yellow-500/50 hover:text-white'
                }`}
              >
                {n} Qs
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={30}
              value={numChallengeQuestions}
              onChange={e => setNumChallengeQuestions(Math.min(30, Math.max(1, parseInt(e.target.value) || 5)))}
              className="w-20 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white text-center outline-none focus:border-yellow-500"
              placeholder="Custom"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-lg font-black text-violet-400">{numChallengeQuestions}</div>
            <div className="text-xs text-gray-500 font-mono uppercase">Questions</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-lg font-black text-teal-400">+250</div>
            <div className="text-xs text-gray-500 font-mono uppercase">Max XP</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-lg font-black text-yellow-400">+{bonusXP}</div>
            <div className="text-xs text-gray-500 font-mono uppercase">Bonus XP</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-3 mb-5 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-mono uppercase">Resets in</span>
          <span className="text-yellow-400 font-mono font-bold">{formatTime(timeLeft)}</span>
        </div>

        <button
          onClick={generateChallenge}
          disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-gray-900 font-black py-3 rounded-xl transition-all text-sm"
        >
          {loading ? '⏳ Preparing challenge...' : `🎯 Start Challenge — ${selectedTopic || todayTopic}`}
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">How it works</div>
        <div className="flex flex-col gap-3">
          {[
            { icon: '🎯', text: 'Pick any topic or use today\'s auto-selected topic' },
            { icon: '⚡', text: 'Answer 5 questions and earn +50 XP per correct answer' },
            { icon: '🏆', text: 'Complete the challenge to earn +200 bonus XP' },
            { icon: '🔥', text: 'Complete daily challenges to build your streak' },
            { icon: '📅', text: 'Only one challenge per day — come back tomorrow!' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm text-gray-400">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}