import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Quizzes from './pages/Quizzes'
import Badges from './pages/Badges'
import Leaderboard from './pages/Leaderboard'
import Progress from './pages/Progress'
import Profile from './pages/Profile'
import Subjects from './pages/Subjects'
import Login from './pages/Login'
import Toast from './components/Toast'
import SubjectDetail from './pages/SubjectDetail'
import DailyChallenge from './pages/DailyChallenge'
import StudyTimer from './pages/StudyTimer'
import Flashcards from './pages/Flashcards'
import Notes from './pages/Notes'
import Analytics from './pages/Analytics'
import StudyPlanner from './pages/StudyPlanner'
import Friends from './pages/Friends'
import MultiplayerQuiz from './pages/MultiplayerQuiz'



export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-violet-400 font-bold animate-pulse">Loading LearnXP...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-950">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/daily" element={<DailyChallenge />} />
            <Route path="/timer" element={<StudyTimer />} />
            <Route path="/planner" element={<StudyPlanner />} />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/multiplayer" element={<MultiplayerQuiz />} />
            <Route path="/subject/:code" element={<SubjectDetail />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      <Toast />
    </BrowserRouter>
  )
}