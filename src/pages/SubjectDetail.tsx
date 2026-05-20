import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const subjectData: Record<string, {
  code: string
  name: string
  color: string
  bar: string
  bg: string
  pct: number
  done: number
  total: number
  modules: { name: string; status: 'done' | 'active' | 'todo'; questions: number }[]
}> = {
  CS301: {
    code: 'CS301',
    name: 'Data Structures & Algorithms',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    bar: 'bg-violet-500',
    pct: 72,
    done: 18,
    total: 25,
    modules: [
      { name: 'Arrays', status: 'done', questions: 10 },
      { name: 'Linked Lists', status: 'done', questions: 8 },
      { name: 'Trees', status: 'done', questions: 12 },
      { name: 'Graphs', status: 'active', questions: 10 },
      { name: 'Dynamic Programming', status: 'todo', questions: 15 },
    ],
  },
  MATH202: {
    code: 'MATH202',
    name: 'Linear Algebra',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
    bar: 'bg-teal-500',
    pct: 45,
    done: 9,
    total: 20,
    modules: [
      { name: 'Vectors', status: 'done', questions: 8 },
      { name: 'Matrices', status: 'done', questions: 10 },
      { name: 'Eigenvalues', status: 'active', questions: 12 },
      { name: 'SVD', status: 'todo', questions: 10 },
      { name: 'Applications', status: 'todo', questions: 8 },
    ],
  },
  PHY101: {
    code: 'PHY101',
    name: 'Classical Mechanics',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    bar: 'bg-orange-500',
    pct: 88,
    done: 22,
    total: 25,
    modules: [
      { name: 'Kinematics', status: 'done', questions: 10 },
      { name: "Newton's Laws", status: 'done', questions: 12 },
      { name: 'Energy', status: 'done', questions: 10 },
      { name: 'Rotation', status: 'done', questions: 8 },
      { name: 'Waves', status: 'active', questions: 12 },
    ],
  },
  ENG110: {
    code: 'ENG110',
    name: 'Technical Writing',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    bar: 'bg-yellow-500',
    pct: 30,
    done: 6,
    total: 20,
    modules: [
      { name: 'Structure', status: 'done', questions: 8 },
      { name: 'Style', status: 'active', questions: 10 },
      { name: 'Reports', status: 'todo', questions: 12 },
      { name: 'Proposals', status: 'todo', questions: 10 },
      { name: 'Revision', status: 'todo', questions: 8 },
    ],
  },
}

const pillClass = (status: string) => {
  if (status === 'done') return 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
  if (status === 'active') return 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
  return 'bg-gray-800 text-gray-500 border border-gray-700'
}

const statusLabel = (status: string) => {
  if (status === 'done') return '✓ Completed'
  if (status === 'active') return '▶ In Progress'
  return '○ Not Started'
}

export default function SubjectDetail() {
  const { code } = useParams()
  const navigate = useNavigate()
  const subject = subjectData[code || '']
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'quiz'>('overview')

  if (!subject) {
    return (
      <div className="w-full text-center py-20">
        <div className="text-5xl mb-4">😕</div>
        <div className="text-white font-bold text-xl mb-2">Subject not found</div>
        <button onClick={() => navigate('/')} className="text-violet-400 hover:underline text-sm">
          ← Back to Dashboard
        </button>
      </div>
    )
  }

  const doneModules = subject.modules.filter(m => m.status === 'done').length
  const totalQuestions = subject.modules.reduce((a, m) => a + m.questions, 0)
  const solvedQuestions = subject.modules
    .filter(m => m.status === 'done')
    .reduce((a, m) => a + m.questions, 0)

  return (
    <div className="w-full">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-2 transition-all"
      >
        ← Back to Dashboard
      </button>

      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className={`text-xs font-mono font-semibold px-2 py-1 rounded-full border ${subject.bg} ${subject.color} inline-block mb-3`}>
              {subject.code}
            </span>
            <h2 className="text-2xl font-black text-white mb-1">{subject.name}</h2>
            <p className="text-gray-400 text-sm">{subject.modules.length} topics · {totalQuestions} total questions</p>
          </div>
          <button
            onClick={() => navigate('/quizzes')}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            ⚡ Start Quiz
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Overall Progress</span>
            <span className={`font-mono font-bold ${subject.color}`}>{subject.pct}%</span>
          </div>
          <div className="bg-gray-800 rounded-full h-3">
            <div className={`${subject.bar} h-3 rounded-full transition-all`} style={{ width: `${subject.pct}%` }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: '📚', label: 'Total Topics', value: subject.modules.length, color: 'text-violet-400' },
          { icon: '✅', label: 'Completed', value: doneModules, color: 'text-teal-400' },
          { icon: '❓', label: 'Total Questions', value: totalQuestions, color: 'text-yellow-400' },
          { icon: '✓', label: 'Solved', value: solvedQuestions, color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className={`text-xl mb-1 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-black text-white mb-1">{s.value}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['overview', 'modules', 'quiz'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize ${activeTab === tab ? 'bg-violet-600 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'}`}
          >
            {tab === 'overview' ? '📊 Overview' : tab === 'modules' ? '📖 Topics' : '⚡ Quiz'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-4">Topic Progress Overview</div>
          <div className="flex flex-col gap-3">
            {subject.modules.map(m => (
              <div key={m.name} className="flex items-center gap-4">
                <div className="w-32 text-sm text-white font-medium truncate">{m.name}</div>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${m.status === 'done' ? 'bg-teal-500' : m.status === 'active' ? 'bg-violet-500' : 'bg-gray-700'}`}
                    style={{ width: m.status === 'done' ? '100%' : m.status === 'active' ? '50%' : '0%' }}
                  />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-mono ${pillClass(m.status)}`}>
                  {statusLabel(m.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'modules' && (
        <div className="flex flex-col gap-3">
          {subject.modules.map((m, i) => (
            <div key={m.name} className={`bg-gray-900 border rounded-xl p-4 flex items-center gap-4 ${m.status === 'active' ? 'border-violet-500/30' : 'border-gray-800'}`}>
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{m.name}</div>
                <div className="text-xs text-gray-500 font-mono">{m.questions} questions</div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-mono ${pillClass(m.status)}`}>
                {statusLabel(m.status)}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'quiz' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">⚡</div>
          <div className="text-xl font-black text-white mb-2">Ready to test your knowledge?</div>
          <p className="text-gray-400 text-sm mb-6">Start a quiz on {subject.name} and earn XP for every correct answer!</p>
          <button
            onClick={() => navigate('/quizzes')}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 py-3 rounded-xl transition-all"
          >
            ⚡ Start Quiz Now
          </button>
        </div>
      )}
    </div>
  )
}