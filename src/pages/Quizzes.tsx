import { useProfile } from '../hooks/useProfile'
import confetti from 'canvas-confetti'
import { useState } from 'react'
import Groq from 'groq-sdk'
import { showToast } from '../components/Toast'

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
})

const defaultQuestions = [
  { q: 'What is the time complexity of binary search?', opts: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], ans: 1, exp: 'Binary search halves the search space each step — O(log n).' },
  { q: 'Which data structure uses LIFO ordering?', opts: ['Queue', 'Linked List', 'Stack', 'Heap'], ans: 2, exp: 'Stacks follow LIFO — last in, first out.' },
  { q: 'Worst-case time complexity of quicksort?', opts: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], ans: 2, exp: 'Quicksort degrades to O(n²) when pivot is always smallest or largest.' },
  { q: 'Which traversal visits Left → Root → Right?', opts: ['Pre-order', 'Post-order', 'Level-order', 'In-order'], ans: 3, exp: 'In-order traversal gives sorted output for BSTs.' },
  { q: 'Average lookup time for a hash table?', opts: ['O(log n)', 'O(n)', 'O(1)', 'O(n log n)'], ans: 2, exp: 'Hash tables provide O(1) average-case lookup.' },
]

type Question = {
  q: string
  opts: string[]
  ans: number
  exp: string
}

export default function Quizzes() {
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions)
  const [topic, setTopic] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [xp, setXp] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [finished, setFinished] = useState(false)
  const { addXP } = useProfile()

  const generateQuiz = async () => {
    if (!topic.trim()) return
    setGenerating(true)
    setGenError('')
    try {
      const response = await groq.chat.completions.create({
        model:'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: `Generate 5 multiple choice quiz questions about "${topic}".
Return ONLY a valid JSON array, no explanation, no markdown, just raw JSON like this:
[
  {
    "q": "Question text here?",
    "opts": ["Option A", "Option B", "Option C", "Option D"],
    "ans": 1,
    "exp": "Brief explanation of the correct answer"
  }
]
The "ans" field is the index (0-3) of the correct option.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      })

      const text = response.choices[0]?.message?.content || ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Invalid response format')
      const parsed = JSON.parse(jsonMatch[0])
      setQuestions(parsed)
      setIndex(0)
      setSelected(null)
      setScore(0)
      setXp(0)
      setAnswered(false)
      setFinished(false)
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
    setIndex(0)
    setSelected(null)
    setScore(0)
    setXp(0)
    setAnswered(false)
    setFinished(false)
  }

  const getOptionClass = (i: number) => {
    if (!answered) return 'border-gray-700 bg-gray-800 hover:border-violet-500/50 hover:bg-violet-500/5 cursor-pointer'
    if (i === q.ans) return 'border-teal-500 bg-teal-500/10 cursor-default'
    if (i === selected && i !== q.ans) return 'border-red-500 bg-red-500/10 cursor-default'
    return 'border-gray-700 bg-gray-800 opacity-50 cursor-default'
  }

  if (finished) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center max-w-md w-full">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-black mb-2 text-white">Quiz Complete!</h2>
          <p className="text-gray-400 mb-6">You scored <span className="text-teal-400 font-bold">{score}/{questions.length}</span> and earned <span className="text-violet-400 font-bold">+{xp} XP</span></p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-2xl font-black text-teal-400">{score}</div>
              <div className="text-xs text-gray-500 uppercase font-mono">Correct</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-2xl font-black text-violet-400">+{xp}</div>
              <div className="text-xs text-gray-500 uppercase font-mono">XP Earned</div>
            </div>
          </div>
          <button onClick={handleReset} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all mb-3">
            Play Again ↗
          </button>
          <button onClick={() => { handleReset(); setQuestions(defaultQuestions) }} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all">
            Back to Default Quiz
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-black mb-1 text-white">Quick Quiz</h2>
      <p className="text-gray-400 text-sm mb-6">Answer questions and earn XP · +50 XP per correct answer</p>

      {/* AI Generator */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">🤖 AI Quiz Generator</div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter any topic e.g. Photosynthesis, World War 2, Python..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateQuiz()}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
          />
          <button
            onClick={generateQuiz}
            disabled={generating || !topic.trim()}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-xl transition-all whitespace-nowrap"
          >
            {generating ? '⏳ Generating...' : '✨ Generate'}
          </button>
        </div>
        {genError && <p className="text-red-400 text-xs mt-2">{genError}</p>}
        {generating && (
          <p className="text-violet-400 text-xs mt-2 animate-pulse">🤖 AI is generating your quiz questions...</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-xs font-mono text-gray-500 whitespace-nowrap">Q {index + 1} / {questions.length}</span>
        <div className="flex-1 bg-gray-800 rounded-full h-2">
          <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
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
    </div>
  )
}