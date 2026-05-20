import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setMessage('')
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Check your email to confirm your account!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2 text-white">
            Learn<span className="text-violet-500">XP</span>
          </h1>
          <p className="text-gray-400 text-sm">Level up your college learning</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6 text-white text-center">{isSignUp ? 'Create account' : 'Welcome back'}</h2>
          <div className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
            />
            {message && (
              <p className={`text-sm ${message.includes('error') ? 'text-red-400' : 'text-green-400'}`}>
                {message}
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg text-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
            <p className="text-center text-gray-500 text-sm">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <span
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-violet-400 cursor-pointer hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </span>
            </p>
          </div>
        </div>
        <p className="text-center text-gray-600 text-xs mt-6">
          🎮 Earn XP · Unlock badges · Climb the leaderboard
        </p>
      </div>
    </div>
  )
}