import { useState, useEffect } from 'react'

type Subject = {
  id: number
  name: string
  code: string
  color: string
  icon: string
  modules: string[]
}

const colorOptions = [
  { label: 'Violet', value: 'bg-violet-500/10 border-violet-500/20 text-violet-400', bar: 'bg-violet-500' },
  { label: 'Teal', value: 'bg-teal-500/10 border-teal-500/20 text-teal-400', bar: 'bg-teal-500' },
  { label: 'Orange', value: 'bg-orange-500/10 border-orange-500/20 text-orange-400', bar: 'bg-orange-500' },
  { label: 'Yellow', value: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400', bar: 'bg-yellow-500' },
  { label: 'Pink', value: 'bg-pink-500/10 border-pink-500/20 text-pink-400', bar: 'bg-pink-500' },
  { label: 'Blue', value: 'bg-blue-500/10 border-blue-500/20 text-blue-400', bar: 'bg-blue-500' },
]

const iconOptions = ['📚', '🔬', '🧮', '💻', '🌍', '🎨', '⚗️', '📐', '🧬', '🏛️', '📝', '🎵']

const STORAGE_KEY = 'learnxp_subjects'

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : [
        { id: 1, name: 'Data Structures & Algorithms', code: 'CS301', color: colorOptions[0].value, icon: '💻', modules: ['Arrays', 'Linked Lists', 'Trees', 'Graphs'] },
        { id: 2, name: 'Linear Algebra', code: 'MATH202', color: colorOptions[1].value, icon: '🧮', modules: ['Vectors', 'Matrices', 'Eigenvalues'] },
      ]
    } catch {
      return []
    }
  })

  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newIcon, setNewIcon] = useState('📚')
  const [newColor, setNewColor] = useState(colorOptions[0].value)
  const [newModule, setNewModule] = useState('')
  const [newModules, setNewModules] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Save to localStorage whenever subjects change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects))
  }, [subjects])

  const handleAddModule = () => {
    if (!newModule.trim()) return
    setNewModules(prev => [...prev, newModule.trim()])
    setNewModule('')
  }

  const handleAddSubject = () => {
    if (!newName.trim() || !newCode.trim()) return
    const subject: Subject = {
      id: Date.now(),
      name: newName.trim(),
      code: newCode.trim().toUpperCase(),
      color: newColor,
      icon: newIcon,
      modules: newModules,
    }
    setSubjects(prev => [...prev, subject])
    setNewName('')
    setNewCode('')
    setNewIcon('📚')
    setNewColor(colorOptions[0].value)
    setNewModules([])
    setShowForm(false)
  }

  const handleDelete = (id: number) => {
    setSubjects(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-black text-white">My Subjects</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
        >
          {showForm ? '✕ Cancel' : '+ Add Subject'}
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-6">Manage your subjects and track topics</p>

      {/* Add Subject Form */}
      {showForm && (
        <div className="bg-gray-900 border border-violet-500/30 rounded-2xl p-6 mb-6">
          <div className="text-xs text-violet-400 uppercase tracking-wider font-mono mb-4">New Subject</div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-400 font-mono mb-1 block">Subject Name</label>
              <input
                type="text"
                placeholder="e.g. Organic Chemistry"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-mono mb-1 block">Subject Code</label>
              <input
                type="text"
                placeholder="e.g. CHEM301"
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Icon picker */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 font-mono mb-2 block">Pick an Icon</label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map(icon => (
                <button
                  key={icon}
                  onClick={() => setNewIcon(icon)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${newIcon === icon ? 'bg-violet-500/30 border border-violet-500' : 'bg-gray-800 border border-gray-700 hover:border-violet-500/50'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 font-mono mb-2 block">Pick a Color</label>
            <div className="flex gap-2">
              {colorOptions.map(c => (
                <button
                  key={c.label}
                  onClick={() => setNewColor(c.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${c.value} ${newColor === c.value ? 'ring-2 ring-white/30' : ''}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modules */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 font-mono mb-2 block">Add Topics/Modules</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="e.g. Alkenes"
                value={newModule}
                onChange={e => setNewModule(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddModule()}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
              />
              <button
                onClick={handleAddModule}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
              >
                Add
              </button>
            </div>
            {newModules.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newModules.map((m, i) => (
                  <span key={i} className="bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs px-3 py-1 rounded-full font-mono flex items-center gap-1">
                    {m}
                    <button onClick={() => setNewModules(prev => prev.filter((_, j) => j !== i))} className="text-violet-300 hover:text-white ml-1">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleAddSubject}
            disabled={!newName.trim() || !newCode.trim()}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
          >
            ✓ Save Subject
          </button>
        </div>
      )}

      {/* Subjects list */}
      {subjects.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">📚</div>
          <div className="font-bold text-white mb-1">No subjects yet</div>
          <div className="text-sm">Click "Add Subject" to get started!</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {subjects.map(s => (
            <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-violet-500/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{s.icon}</div>
                  <div>
                    <div className="font-bold text-sm text-white">{s.name}</div>
                    <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${s.color} inline-block mt-1`}>
                      {s.code}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-gray-600 hover:text-red-400 transition-all text-sm"
                >
                  🗑️
                </button>
              </div>

              {s.modules.length > 0 && (
                <div>
                  <button
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    className="text-xs text-gray-500 hover:text-gray-300 font-mono mb-2 transition-all"
                  >
                    {expandedId === s.id ? '▼' : '▶'} {s.modules.length} topics
                  </button>
                  {expandedId === s.id && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {s.modules.map((m, i) => (
                        <span key={i} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full font-mono">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}