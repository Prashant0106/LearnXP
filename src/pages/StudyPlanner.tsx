import { useState, useEffect } from 'react'
import { showToast } from '../components/Toast'

type Priority = 'high' | 'medium' | 'low'
type Status = 'pending' | 'in-progress' | 'done'

type Task = {
  id: number
  title: string
  subject: string
  topic: string
  date: string
  time: string
  duration: number
  priority: Priority
  status: Status
  notes: string
}

type Subject = {
  id: number
  name: string
  code: string
  icon: string
}

const STORAGE_KEY = 'learnxp_planner_tasks'

const priorityConfig = {
  high: { label: 'High', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  low: { label: 'Low', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
}

const statusConfig = {
  pending: { label: 'Pending', color: 'text-gray-400', bg: 'bg-gray-800' },
  'in-progress': { label: 'In Progress', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  done: { label: 'Done ✓', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
}

const loadTasks = (): Task[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

const loadSubjects = (): Subject[] => {
  try {
    const saved = localStorage.getItem('learnxp_subjects')
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

export default function StudyPlanner() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)
  const [subjects, setSubjects] = useState<Subject[]>(loadSubjects)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'all'>('today')
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('')

  // Form state
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('09:00')
  const [duration, setDuration] = useState(60)
  const [priority, setPriority] = useState<Priority>('medium')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setSubjects(loadSubjects())
  }, [])

  const resetForm = () => {
    setTitle('')
    setSubject('')
    setTopic('')
    setDate(new Date().toISOString().split('T')[0])
    setTime('09:00')
    setDuration(60)
    setPriority('medium')
    setNotes('')
    setEditingTask(null)
    setShowForm(false)
  }

  const handleSave = () => {
    if (!title.trim()) {
      showToast('Please add a title!', 'error')
      return
    }

    if (editingTask) {
      const updated = tasks.map(t => t.id === editingTask.id
        ? { ...t, title, subject, topic, date, time, duration, priority, notes }
        : t
      )
      setTasks(updated)
      saveTasks(updated)
      showToast('Task updated!', 'success')
    } else {
      const newTask: Task = {
        id: Date.now(),
        title: title.trim(),
        subject,
        topic,
        date,
        time,
        duration,
        priority,
        status: 'pending',
        notes,
      }
      const updated = [...tasks, newTask].sort((a, b) =>
        new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()
      )
      setTasks(updated)
      saveTasks(updated)
      showToast('Task added to planner!', 'success')
    }
    resetForm()
  }

  const handleEdit = (task: Task) => {
    setTitle(task.title)
    setSubject(task.subject)
    setTopic(task.topic)
    setDate(task.date)
    setTime(task.time)
    setDuration(task.duration)
    setPriority(task.priority)
    setNotes(task.notes)
    setEditingTask(task)
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    const updated = tasks.filter(t => t.id !== id)
    setTasks(updated)
    saveTasks(updated)
    showToast('Task deleted!', 'info')
  }

  const handleStatusChange = (id: number, status: Status) => {
    const updated = tasks.map(t => t.id === id ? { ...t, status } : t)
    setTasks(updated)
    saveTasks(updated)
    if (status === 'done') showToast('Task completed! 🎉', 'success')
  }

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const getFilteredTasks = () => {
    let filtered = tasks
    if (filterPriority) filtered = filtered.filter(t => t.priority === filterPriority)

    if (activeTab === 'today') {
      filtered = filtered.filter(t => t.date === today)
    } else if (activeTab === 'upcoming') {
      filtered = filtered.filter(t => t.date > today)
    }
    return filtered
  }

  const filteredTasks = getFilteredTasks()
  const todayTasks = tasks.filter(t => t.date === today)
  const upcomingTasks = tasks.filter(t => t.date > today)
  const doneTodayTasks = todayTasks.filter(t => t.status === 'done')
  const overdueTasks = tasks.filter(t => t.date < today && t.status !== 'done')

  // Add/Edit form
  if (showForm) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white">
            {editingTask ? '✏️ Edit Task' : '📅 New Task'}
          </h2>
          <button onClick={resetForm} className="text-gray-400 hover:text-white text-sm transition-all">
            ✕ Cancel
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          {/* Title */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 font-mono uppercase mb-2 block">Task Title *</label>
            <input
              type="text"
              placeholder="e.g. Study Arrays chapter..."
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

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-400 font-mono uppercase mb-2 block">Date *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-mono uppercase mb-2 block">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Duration & Priority */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-400 font-mono uppercase mb-2 block">Duration (minutes)</label>
              <div className="flex gap-2">
                {[30, 60, 90, 120].map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${duration === d
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-mono uppercase mb-2 block">Priority</label>
              <div className="flex gap-2">
                {(Object.keys(priorityConfig) as Priority[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all capitalize border ${priority === p
                      ? priorityConfig[p].bg + ' ' + priorityConfig[p].color
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                    }`}
                  >
                    {priorityConfig[p].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="text-xs text-gray-400 font-mono uppercase mb-2 block">Notes (optional)</label>
            <textarea
              placeholder="Any additional notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all"
            >
              {editingTask ? '✓ Update Task' : '✓ Add Task'}
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

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-black text-white">Study Planner 📅</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
        >
          + Add Task
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-6">Plan your study sessions and stay on track</p>

      {/* Overview stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: '📅', label: "Today's Tasks", value: todayTasks.length, color: 'text-violet-400' },
          { icon: '✅', label: 'Completed', value: doneTodayTasks.length, color: 'text-teal-400' },
          { icon: '⏰', label: 'Upcoming', value: upcomingTasks.length, color: 'text-yellow-400' },
          { icon: '⚠️', label: 'Overdue', value: overdueTasks.length, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className={`text-xl mb-1 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-black text-white mb-1">{s.value}</div>
            <div className="text-xs text-gray-500 uppercase font-mono">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Overdue warning */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="text-sm font-bold text-red-400">
              {overdueTasks.length} overdue {overdueTasks.length === 1 ? 'task' : 'tasks'}!
            </div>
            <div className="text-xs text-gray-400">Please complete or reschedule them</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'today', label: `Today (${todayTasks.length})` },
          { key: 'upcoming', label: `Upcoming (${upcomingTasks.length})` },
          { key: 'all', label: `All (${tasks.length})` },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key
              ? 'bg-violet-600 text-white'
              : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}

        {/* Priority filter */}
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value as Priority | '')}
          className="ml-auto bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
        >
          <option value="">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {/* Tasks list */}
      {filteredTasks.length === 0 ? (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">📅</div>
          <div className="text-white font-bold mb-1">
            {activeTab === 'today' ? 'No tasks for today!' : 'No tasks found'}
          </div>
          <div className="text-gray-400 text-sm mb-4">
            {activeTab === 'today' ? 'Add a study session to get started' : 'Try changing the filter'}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
          >
            + Add Task
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`bg-gray-900 border rounded-xl p-4 transition-all ${task.status === 'done'
                ? 'border-teal-500/20 opacity-60'
                : task.date < today
                  ? 'border-red-500/20'
                  : 'border-gray-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Status checkbox */}
                <button
                  onClick={() => handleStatusChange(task.id, task.status === 'done' ? 'pending' : 'done')}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${task.status === 'done'
                    ? 'bg-teal-500 border-teal-500 text-white'
                    : 'border-gray-600 hover:border-teal-500'
                  }`}
                >
                  {task.status === 'done' && <span className="text-xs">✓</span>}
                </button>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className={`font-bold text-sm ${task.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>
                        {task.title}
                      </div>
                      {(task.subject || task.topic) && (
                        <div className="text-xs text-violet-400 font-mono mt-0.5">
                          {task.subject} {task.topic && `· ${task.topic}`}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${priorityConfig[task.priority].bg} ${priorityConfig[task.priority].color}`}>
                        {priorityConfig[task.priority].label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 font-mono">
                    <span>📅 {new Date(task.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span>🕐 {task.time}</span>
                    <span>⏱️ {task.duration}m</span>
                    {task.date < today && task.status !== 'done' && (
                      <span className="text-red-400">Overdue!</span>
                    )}
                  </div>

                  {task.notes && (
                    <div className="mt-2 text-xs text-gray-400 bg-gray-800 rounded-lg px-3 py-2">
                      {task.notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <select
                    value={task.status}
                    onChange={e => handleStatusChange(task.id, e.target.value as Status)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <button
                    onClick={() => handleEdit(task)}
                    className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-all"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1.5 bg-gray-800 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}