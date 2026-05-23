import { useState, useEffect } from 'react'
import { showToast } from '../components/Toast'

type Note = {
  id: number
  title: string
  content: string
  subject: string
  topic: string
  color: string
  createdAt: string
  updatedAt: string
}

type Subject = {
  id: number
  name: string
  code: string
  icon: string
}

const STORAGE_KEY = 'learnxp_notes'

const colorOptions = [
  { label: 'Purple', value: 'border-violet-500/30 bg-violet-500/5' },
  { label: 'Teal', value: 'border-teal-500/30 bg-teal-500/5' },
  { label: 'Yellow', value: 'border-yellow-500/30 bg-yellow-500/5' },
  { label: 'Red', value: 'border-red-500/30 bg-red-500/5' },
  { label: 'Blue', value: 'border-blue-500/30 bg-blue-500/5' },
  { label: 'Pink', value: 'border-pink-500/30 bg-pink-500/5' },
]

const loadNotes = (): Note[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

const saveNotes = (notes: Note[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

const loadSubjects = (): Subject[] => {
  try {
    const saved = localStorage.getItem('learnxp_subjects')
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>(loadNotes)
  const [subjects, setSubjects] = useState<Subject[]>(loadSubjects)
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSubject, setFilterSubject] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [color, setColor] = useState(colorOptions[0].value)

  useEffect(() => {
    setSubjects(loadSubjects())
  }, [])

  const resetForm = () => {
    setTitle('')
    setContent('')
    setSubject('')
    setTopic('')
    setColor(colorOptions[0].value)
    setEditingNote(null)
    setShowForm(false)
  }

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      showToast('Please add a title and content!', 'error')
      return
    }

    if (editingNote) {
      const updated = notes.map(n => n.id === editingNote.id
        ? { ...n, title, content, subject, topic, color, updatedAt: new Date().toISOString() }
        : n
      )
      setNotes(updated)
      saveNotes(updated)
      showToast('Note updated!', 'success')
    } else {
      const newNote: Note = {
        id: Date.now(),
        title: title.trim(),
        content: content.trim(),
        subject,
        topic,
        color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const updated = [newNote, ...notes]
      setNotes(updated)
      saveNotes(updated)
      showToast('Note saved!', 'success')
    }
    resetForm()
  }

  const handleEdit = (note: Note) => {
    setTitle(note.title)
    setContent(note.content)
    setSubject(note.subject)
    setTopic(note.topic)
    setColor(note.color)
    setEditingNote(note)
    setShowForm(true)
    setActiveNote(null)
  }

  const handleDelete = (id: number) => {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    saveNotes(updated)
    setActiveNote(null)
    showToast('Note deleted!', 'info')
  }

  const filteredNotes = notes.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.topic.toLowerCase().includes(searchQuery.toLowerCase())
    const matchSubject = filterSubject ? n.subject === filterSubject : true
    return matchSearch && matchSubject
  })

  // View note
  if (activeNote) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setActiveNote(null)}
            className="text-gray-400 hover:text-white text-sm transition-all flex items-center gap-2"
          >
            ← Back to Notes
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(activeNote)}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => handleDelete(activeNote.id)}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold px-4 py-2 rounded-xl text-sm transition-all"
            >
              🗑️ Delete
            </button>
          </div>
        </div>

        <div className={`bg-gray-900 border ${activeNote.color} rounded-2xl p-6`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              {activeNote.subject && (
                <div className="text-xs text-violet-400 font-mono uppercase tracking-wider mb-1">
                  {activeNote.subject} {activeNote.topic && `· ${activeNote.topic}`}
                </div>
              )}
              <h2 className="text-2xl font-black text-white">{activeNote.title}</h2>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-mono mb-4">
            Last updated: {new Date(activeNote.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {activeNote.content}
          </div>
        </div>
      </div>
    )
  }

  // Add/Edit form
  if (showForm) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white">
            {editingNote ? '✏️ Edit Note' : '📝 New Note'}
          </h2>
          <button
            onClick={resetForm}
            className="text-gray-400 hover:text-white text-sm transition-all"
          >
            ✕ Cancel
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          {/* Title */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 font-mono uppercase mb-2 block">Title *</label>
            <input
              type="text"
              placeholder="Note title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
            />
          </div>

          {/* Subject & Topic */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-400 font-mono uppercase mb-2 block">Subject</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
              >
                <option value="">No subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.name}>{s.icon} {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-mono uppercase mb-2 block">Topic</label>
              <input
                type="text"
                placeholder="e.g. Arrays, Vectors..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Color picker */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 font-mono uppercase mb-2 block">Color</label>
            <div className="flex gap-2">
              {colorOptions.map(c => (
                <button
                  key={c.label}
                  onClick={() => setColor(c.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${c.value} ${color === c.value ? 'ring-2 ring-white/30' : ''}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="text-xs text-gray-400 font-mono uppercase mb-2 block">Content *</label>
            <textarea
              placeholder="Write your notes here..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={10}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!title.trim() || !content.trim()}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all"
            >
              {editingNote ? '✓ Update Note' : '✓ Save Note'}
            </button>
            <button
              onClick={resetForm}
              className="px-6 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main notes list
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-black text-white">Notes 📝</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
        >
          + New Note
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-6">{notes.length} notes saved</p>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
        />
        <select
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500"
        >
          <option value="">All Subjects</option>
          {subjects.map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Notes grid */}
      {filteredNotes.length === 0 ? (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">📝</div>
          <div className="text-white font-bold mb-1">
            {notes.length === 0 ? 'No notes yet' : 'No notes found'}
          </div>
          <div className="text-gray-400 text-sm mb-4">
            {notes.length === 0 ? 'Create your first note!' : 'Try a different search or filter'}
          </div>
          {notes.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
            >
              + Create Note
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              onClick={() => setActiveNote(note)}
              className={`bg-gray-900 border ${note.color} rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 transition-all`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-bold text-white text-sm flex-1 pr-2">{note.title}</div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(note.id) }}
                  className="text-gray-600 hover:text-red-400 transition-all text-xs flex-shrink-0"
                >
                  🗑️
                </button>
              </div>
              {(note.subject || note.topic) && (
                <div className="text-xs text-violet-400 font-mono mb-2">
                  {note.subject} {note.topic && `· ${note.topic}`}
                </div>
              )}
              <div className="text-xs text-gray-400 line-clamp-3 leading-relaxed mb-3">
                {note.content}
              </div>
              <div className="text-xs text-gray-600 font-mono">
                {new Date(note.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}