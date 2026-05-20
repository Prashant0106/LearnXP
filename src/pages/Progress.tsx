const courses = [
  {
    code: 'CS301',
    name: 'Data Structures & Algorithms',
    pct: 72,
    color: 'bg-violet-500',
    modules: [
      { name: 'Arrays', status: 'done' },
      { name: 'Linked Lists', status: 'done' },
      { name: 'Trees', status: 'done' },
      { name: 'Graphs', status: 'active' },
      { name: 'Dynamic Programming', status: 'todo' },
    ],
  },
  {
    code: 'MATH202',
    name: 'Linear Algebra',
    pct: 45,
    color: 'bg-teal-500',
    modules: [
      { name: 'Vectors', status: 'done' },
      { name: 'Matrices', status: 'done' },
      { name: 'Eigenvalues', status: 'active' },
      { name: 'SVD', status: 'todo' },
      { name: 'Applications', status: 'todo' },
    ],
  },
  {
    code: 'PHY101',
    name: 'Classical Mechanics',
    pct: 88,
    color: 'bg-orange-500',
    modules: [
      { name: 'Kinematics', status: 'done' },
      { name: "Newton's Laws", status: 'done' },
      { name: 'Energy', status: 'done' },
      { name: 'Rotation', status: 'done' },
      { name: 'Waves', status: 'active' },
    ],
  },
  {
    code: 'ENG110',
    name: 'Technical Writing',
    pct: 30,
    color: 'bg-yellow-500',
    modules: [
      { name: 'Structure', status: 'done' },
      { name: 'Style', status: 'active' },
      { name: 'Reports', status: 'todo' },
      { name: 'Proposals', status: 'todo' },
      { name: 'Revision', status: 'todo' },
    ],
  },
]

const pillClass = (status: string) => {
  if (status === 'done') return 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
  if (status === 'active') return 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
  return 'bg-gray-800 text-gray-500 border border-gray-700'
}

const pillLabel = (status: string) => {
  if (status === 'done') return '✓'
  if (status === 'active') return '▶'
  return '○'
}

export default function Progress() {
  const totalPct = Math.round(courses.reduce((a, c) => a + c.pct, 0) / courses.length)

  return (
    <div className="w-full">
      <h2 className="text-2xl font-black mb-1 text-white">Learning Progress</h2>
      <p className="text-gray-400 text-sm mb-6">Your journey across all courses this semester</p>

      {/* Overall progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-sm text-white">Overall Completion</span>
          <span className="text-teal-400 font-mono font-bold">{totalPct}%</span>
        </div>
        <div className="bg-gray-800 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-violet-500 to-teal-500 h-3 rounded-full transition-all"
            style={{ width: `${totalPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 font-mono mt-2">
          <span>{courses.length} courses enrolled</span>
          <span>{courses.filter(c => c.pct === 100).length} completed</span>
        </div>
      </div>

      {/* Per course */}
      <div className="text-xs text-gray-400 uppercase tracking-wider font-mono mb-3">Courses</div>
      <div className="flex flex-col gap-4">
        {courses.map(c => (
          <div key={c.code} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-bold text-sm text-white">{c.name}</div>
                <div className="text-xs text-gray-400 font-mono">{c.code}</div>
              </div>
              <span className="text-teal-400 font-mono font-bold text-sm">{c.pct}%</span>
            </div>
            <div className="bg-gray-800 rounded-full h-2 mb-4">
              <div className={`${c.color} h-2 rounded-full transition-all`} style={{ width: `${c.pct}%` }} />
            </div>
            <div className="flex flex-wrap gap-2">
              {c.modules.map(m => (
                <span key={m.name} className={`text-xs px-3 py-1 rounded-full font-mono ${pillClass(m.status)}`}>
                  {pillLabel(m.status)} {m.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}