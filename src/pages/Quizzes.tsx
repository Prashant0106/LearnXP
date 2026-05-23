import { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import confetti from 'canvas-confetti'
import { showToast } from '../components/Toast'
import { supabase } from '../lib/supabase'
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

export default function Quizzes() {
  const { addXP } = useProfile()
  const [topic, setTopic] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [numQuestions, setNumQuestions] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [quizStarted, setQuizStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [xp, setXp] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [finished, setFinished] = useState(false)
  
  const getAskedQuestions = (t: string): string[] => {
    try {
      const saved = localStorage.getItem(`learnxp_asked_${t.toLowerCase().replace(/\s+/g, '_')}`)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  }

  const saveAskedQuestions = (t: string, questions: string[]) => {
    try {
      localStorage.setItem(`learnxp_asked_${t.toLowerCase().replace(/\s+/g, '_')}`, JSON.stringify(questions))
    } catch { }
  }

  const allSuggestions = [
    'Data Structures', 'Algorithms', 'Binary Search', 'Sorting Algorithms',
    'Linear Algebra', 'Calculus', 'Probability', 'Statistics',
    'Photosynthesis', 'Cell Biology', 'DNA & Genetics', 'Human Anatomy',
    'World War 2', 'World War 1', 'Indian History', 'Ancient Rome',
    'Python Basics', 'JavaScript', 'React', 'SQL Queries', 'Git Commands',
    'Newton\'s Laws', 'Thermodynamics', 'Quantum Mechanics', 'Optics',
    'Organic Chemistry', 'Periodic Table', 'Chemical Bonding',
    'Cricket', 'Football', 'Olympics', 'Chess',
    'Machine Learning', 'Neural Networks', 'Computer Networks',
    'Indian Geography', 'World Geography', 'Climate Change',
    'English Grammar', 'Shakespeare', 'Poetry',
    'Economics', 'Stock Market', 'Entrepreneurship',
  ]

  const filteredSuggestions = topic.trim()
    ? allSuggestions.filter(s =>
        s.toLowerCase().includes(topic.toLowerCase())
      ).slice(0, 6)
    : allSuggestions.slice(0, 6)

  const generateQuiz = async () => {
    if (!topic.trim()) return
    setGenerating(true)
    setGenError('')
    try {
      const askedBefore = getAskedQuestions(topic)
      const avoidText = askedBefore.length > 0
        ? `\n\nIMPORTANT: Do NOT repeat any of these questions that were already asked:\n${askedBefore.slice(-20).map((q, i) => `${i + 1}. ${q}`).join('\n')}`
        : ''

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: `Generate ${numQuestions} multiple choice quiz questions about "${topic}".
Return ONLY a valid JSON array, no explanation, no markdown, just raw JSON like this:
[
  {
    "q": "Question text here?",
    "opts": ["Option A", "Option B", "Option C", "Option D"],
    "ans": 1,
    "exp": "Brief explanation of the correct answer"
  }
]
The "ans" field is the index (0-3) of the correct option.${avoidText}`
          }
        ],
        temperature: 0.9,
        max_tokens: 2000,
      })

      const text = response.choices[0]?.message?.content || ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Invalid response format')
      const parsed = JSON.parse(jsonMatch[0])

      // Save these questions so they won't repeat next time
      const newAsked = [...askedBefore, ...parsed.map((q: Question) => q.q)]
      saveAskedQuestions(topic, newAsked)

      setQuestions(parsed)
      setIndex(0)
      setSelected(null)
      setScore(0)
      setXp(0)
      setAnswered(false)
      setFinished(false)
      setQuizStarted(true)
    } catch (err) {
      setGenError('Failed to generate quiz. Please try again!')
    }
    setGenerating(false)
  }

  const q = questions[index]

  const handleSelect = async (i: number) => {
    if (answered) return
    setSelected(i)
    setAnswered(true)
    if (i === q.ans) {
      setScore(s => s + 1)
      setXp(x => x + 50)
      showToast('+50 XP earned!', 'xp')
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#7C5CFC', '#00D4AA'],
      })
    } else {
      showToast('Not quite! Try the next one 💪', 'error')
    }
  }

  const handleNext = async () => {
    if (index < questions.length - 1) {
      setIndex(i => i + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      setFinished(true)
      if (xp > 0) {
        await addXP(xp)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('quiz_scores').insert({
            user_id: user.id,
            score: score,
            xp_earned: xp,
            played_at: new Date().toISOString()
          })
        }
        showToast(`Quiz complete! +${xp} XP saved!`, 'success')
      }
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#7C5CFC', '#00D4AA', '#F5B731', '#FF7B5C'],
      })
    }
  }

  const handleReset = () => {
    setQuizStarted(false)
    setQuestions([])
    setIndex(0)
    setSelected(null)
    setScore(0)
    setXp(0)
    setAnswered(false)
    setFinished(false)
    setTopic('')
  }

  const getOptionClass = (i: number) => {
    if (!answered) return 'border-gray-700 bg-gray-800 hover:border-violet-500/50 hover:bg-violet-500/5 cursor-pointer'
    if (i === q.ans) return 'border-teal-500 bg-teal-500/10 cursor-default'
    if (i === selected && i !== q.ans) return 'border-red-500 bg-red-500/10 cursor-default'
    return 'border-gray-700 bg-gray-800 opacity-50 cursor-default'
  }

  // Finished screen
  if (finished) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center max-w-md w-full">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-white mb-2">Quiz Complete!</h2>
          <p className="text-gray-400 mb-2">Topic: <span className="text-violet-400 font-bold">{topic}</span></p>
          <p className="text-gray-400 mb-6">
            You scored <span className="text-teal-400 font-bold">{score}/{questions.length}</span> and earned <span className="text-violet-400 font-bold">+{xp} XP</span>
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-2xl font-black text-teal-400">{score}</div>
              <div className="text-xs text-gray-500 uppercase font-mono">Correct</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-2xl font-black text-red-400">{questions.length - score}</div>
              <div className="text-xs text-gray-500 uppercase font-mono">Wrong</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-2xl font-black text-violet-400">+{xp}</div>
              <div className="text-xs text-gray-500 uppercase font-mono">XP Earned</div>
            </div>
          </div>
          <button
            onClick={() => {
              setFinished(false)
              setQuizStarted(false)
              setQuestions([])
            }}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all mb-3"
          >
            🔄 New Questions — Same Topic
          </button>
          <button
            onClick={handleReset}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            🎯 Try New Topic
          </button>
        </div>
      </div>
    )
  }

  // Quiz in progress
  if (quizStarted && questions.length > 0) {
    return (
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">Quick Quiz</h2>
            <p className="text-gray-400 text-sm">Topic: <span className="text-violet-400 font-semibold">{topic}</span></p>
          </div>
          <button
            onClick={handleReset}
            className="text-gray-500 hover:text-white text-sm transition-all"
          >
            ✕ Exit Quiz
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-xs font-mono text-gray-500 whitespace-nowrap">Q {index + 1} / {questions.length}</span>
          <div className="flex-1 bg-gray-800 rounded-full h-2">
            <div
              className="bg-violet-500 h-2 rounded-full transition-all"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-violet-400 whitespace-nowrap">Score: {score}</span>
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

        {/* Feedback */}
        {answered && (
          <div className={`px-4 py-3 rounded-xl text-sm mb-4 ${selected === q.ans ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            {selected === q.ans ? '✓ Correct! ' : '✗ Not quite. '}{q.exp}
            {selected === q.ans && <span className="ml-2 font-bold text-violet-400">+50 XP</span>}
          </div>
        )}

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={!answered}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-all"
        >
          {index < questions.length - 1 ? 'Next →' : 'Finish Quiz'}
        </button>
        {/* Reset history */}
        {getAskedQuestions(topic).length > 0 && (
          <button
            onClick={() => {
              localStorage.removeItem(`learnxp_asked_${topic.toLowerCase().replace(/\s+/g, '_')}`)
              showToast('Question history cleared!', 'info')
            }}
            className="text-xs text-gray-500 hover:text-gray-300 font-mono mt-2 transition-all"
          >
            🔄 Reset question history for "{topic}"
          </button>
        )}
      </div>
    )
  }

  // Landing screen — before quiz starts
  return (
    <div className="w-full">
      <h2 className="text-2xl font-black text-white mb-1">Quick Quiz</h2>
      <p className="text-gray-400 text-sm mb-8">Enter a topic and let AI generate questions for you</p>

      {/* AI Generator */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-4">🤖 AI Quiz Generator</div>

        {/* Topic input */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 font-mono mb-2 block">Enter Topic</label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Photosynthesis, World War 2, Python, Cricket..."
              value={topic}
              onChange={e => {
                setTopic(e.target.value)
                setShowSuggestions(true)
              }}
              onKeyDown={e => e.key === 'Enter' && generateQuiz()}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
            />
            {/* Real-time suggestions dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-10 shadow-xl">
                {filteredSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={() => {
                      setTopic(s)
                      setShowSuggestions(false)
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-all flex items-center gap-2"
                  >
                    <span className="text-gray-500 font-mono text-xs">🔍</span>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Question count */}
        <div className="mb-6">
          <label className="text-xs text-gray-400 font-mono mb-2 block">Number of Questions</label>
          <div className="flex gap-2 flex-wrap">
            {[5, 10, 15, 20].map(n => (
              <button
                key={n}
                onClick={() => setNumQuestions(n)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${numQuestions === n
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-violet-500/50 hover:text-white'
                  }`}
              >
                {n} Questions
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={30}
              value={numQuestions}
              onChange={e => setNumQuestions(Math.min(30, Math.max(1, parseInt(e.target.value) || 5)))}
              className="w-20 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white text-center outline-none focus:border-violet-500"
              placeholder="Custom"
            />
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generateQuiz}
          disabled={generating || !topic.trim()}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-sm"
        >
          {generating ? `⏳ Generating ${numQuestions} questions about "${topic}"...` : '✨ Generate Quiz'}
        </button>

        {genError && <p className="text-red-400 text-xs mt-3">{genError}</p>}
      </div>

      {/* Popular Topics */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">🔥 Popular Topics</div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '💻 Data Structures', value: 'Data Structures' },
            { label: '🧮 Linear Algebra', value: 'Linear Algebra' },
            { label: '🌿 Photosynthesis', value: 'Photosynthesis' },
            { label: '🌍 World War 2', value: 'World War 2' },
            { label: '🐍 Python Basics', value: 'Python Basics' },
            { label: '⚛️ Quantum Mechanics', value: 'Quantum Mechanics' },
            { label: '🏏 Cricket', value: 'Cricket' },
            { label: '🤖 Machine Learning', value: 'Machine Learning' },
            { label: '⚗️ Organic Chemistry', value: 'Organic Chemistry' },
            { label: '📜 Indian History', value: 'Indian History' },
            { label: '🧬 DNA & Genetics', value: 'DNA & Genetics' },
            { label: '📊 Statistics', value: 'Statistics' },
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setTopic(t.value)}
              className="bg-gray-800 hover:bg-violet-500/20 border border-gray-700 hover:border-violet-500/50 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-lg font-mono transition-all"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}