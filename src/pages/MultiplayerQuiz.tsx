import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { showToast } from '../components/Toast'
import confetti from 'canvas-confetti'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
})

type Question = { q: string; opts: string[]; ans: number; exp: string }
type Participant = { user_id: string; name: string; score: number; xp_earned: number; answers: number[] }
type Room = { id: string; host_id: string; status: string; topic: string; num_questions: number; current_question: number; questions: Question[] }

const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

export default function MultiplayerQuiz() {
  const { profile, addXP } = useProfile()
  const [screen, setScreen] = useState<'lobby' | 'create' | 'join' | 'waiting' | 'quiz' | 'results'>('lobby')
  const [room, setRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [joinCode, setJoinCode] = useState('')
  const [topic, setTopic] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15)
  const [myScore, setMyScore] = useState(0)
  const [myXP, setMyXP] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const isHost = room?.host_id === profile?.id

  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current)
      channelRef.current?.unsubscribe()
    }
  }, [])

  const subscribeToRoom = (roomId: string) => {
    const channel = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_rooms', filter: `id=eq.${roomId}` },
        payload => {
          const updated = payload.new as Room
          setRoom(updated)
          if (updated.status === 'active') {
            setScreen('quiz')
            setCurrentQ(updated.current_question || 0)
            setSelected(null)
            setAnswered(false)
            startTimer(updated)
          }
          if (updated.status === 'finished') {
            timerRef.current && clearInterval(timerRef.current)
            setScreen('results')
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` },
        async () => { await loadParticipants(roomId) }
      )
      .subscribe()
    channelRef.current = channel
  }

  const startTimer = (currentRoom: Room) => {
    timerRef.current && clearInterval(timerRef.current)
    setTimeLeft(15)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const loadParticipants = async (roomId: string) => {
    const { data } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', roomId)
      .order('score', { ascending: false })
    setParticipants(data || [])
  }

  const createRoom = async () => {
    if (!topic.trim() || !profile) return
    setGenerating(true)
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Generate ${numQuestions} multiple choice quiz questions about "${topic}".
Return ONLY a valid JSON array:
[{"q": "Question?", "opts": ["A", "B", "C", "D"], "ans": 1, "exp": "Explanation"}]`
        }],
        temperature: 0.7,
        max_tokens: 2000,
      })
      const text = response.choices[0]?.message?.content || ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Invalid format')
      const questions = JSON.parse(jsonMatch[0])

      const roomId = generateRoomCode()
      const { error } = await supabase.from('quiz_rooms').insert({
        id: roomId,
        host_id: profile.id,
        status: 'waiting',
        topic,
        num_questions: numQuestions,
        current_question: 0,
        questions,
      })

      if (error) throw error

      await supabase.from('room_participants').insert({
        room_id: roomId,
        user_id: profile.id,
        name: profile.name || 'Host',
        score: 0,
        xp_earned: 0,
        answers: [],
      })

      const { data: roomData } = await supabase.from('quiz_rooms').select('*').eq('id', roomId).single()
      setRoom(roomData)
      subscribeToRoom(roomId)
      setScreen('waiting')
      showToast(`Room created! Code: ${roomId}`, 'success')
    } catch {
      showToast('Failed to create room. Try again!', 'error')
    }
    setGenerating(false)
  }

  const joinRoom = async () => {
    if (!joinCode.trim() || !profile) return
    const code = joinCode.toUpperCase()

    const { data: roomData } = await supabase
      .from('quiz_rooms')
      .select('*')
      .eq('id', code)
      .single()

    if (!roomData) {
      showToast('Room not found!', 'error')
      return
    }
    if (roomData.status !== 'waiting') {
      showToast('Room already started!', 'error')
      return
    }

    const { error } = await supabase.from('room_participants').insert({
      room_id: code,
      user_id: profile.id,
      name: profile.name || 'Player',
      score: 0,
      xp_earned: 0,
      answers: [],
    })

    if (error) {
      showToast('Already joined this room!', 'error')
      return
    }

    setRoom(roomData)
    subscribeToRoom(code)
    await loadParticipants(code)
    setScreen('waiting')
    showToast('Joined room! 🎉', 'success')
  }

  const startGame = async () => {
    if (!room) return
    await supabase.from('quiz_rooms').update({ status: 'active', current_question: 0 }).eq('id', room.id)
  }

  const handleAnswer = async (optIndex: number) => {
    if (answered || !room || !profile) return
    setSelected(optIndex)
    setAnswered(true)
    timerRef.current && clearInterval(timerRef.current)

    const q = room.questions[currentQ]
    const isCorrect = optIndex === q.ans
    const xpEarned = isCorrect ? 50 : 0
    const newScore = myScore + (isCorrect ? 1 : 0)
    const newXP = myXP + xpEarned

    setMyScore(newScore)
    setMyXP(newXP)

    if (isCorrect) {
      showToast('+50 XP! Correct! ⚡', 'xp')
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#7C5CFC', '#00D4AA'] })
    }

    await supabase.from('room_participants')
      .update({ score: newScore, xp_earned: newXP })
      .eq('room_id', room.id)
      .eq('user_id', profile.id)
  }

  const nextQuestion = async () => {
    if (!room || !isHost) return
    const next = currentQ + 1
    if (next >= room.questions.length) {
      await supabase.from('quiz_rooms').update({ status: 'finished' }).eq('id', room.id)
      await addXP(myXP)
    } else {
      await supabase.from('quiz_rooms').update({ current_question: next }).eq('id', room.id)
      setCurrentQ(next)
      setSelected(null)
      setAnswered(false)
      startTimer(room)
    }
  }

  const leaveRoom = async () => {
    if (!room || !profile) return
    await supabase.from('room_participants').delete().eq('room_id', room.id).eq('user_id', profile.id)
    if (isHost) await supabase.from('quiz_rooms').delete().eq('id', room.id)
    channelRef.current?.unsubscribe()
    setRoom(null)
    setParticipants([])
    setMyScore(0)
    setMyXP(0)
    setScreen('lobby')
  }

  // Results screen
  if (screen === 'results') {
    const sorted = [...participants].sort((a, b) => b.score - a.score)
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🏆</div>
            <h2 className="text-2xl font-black text-white">Game Over!</h2>
            <p className="text-gray-400 text-sm">Topic: <span className="text-violet-400">{room?.topic}</span></p>
          </div>
          <div className="flex flex-col gap-2 mb-6">
            {sorted.map((p, i) => (
              <div key={p.user_id} className={`flex items-center gap-3 p-3 rounded-xl ${p.user_id === profile?.id ? 'bg-violet-500/10 border border-violet-500/30' : 'bg-gray-800'}`}>
                <div className="text-lg font-black w-8 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center text-xs font-black">
                  {p.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">
                    {p.name} {p.user_id === profile?.id && <span className="text-violet-400 text-xs">(You)</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-teal-400">{p.score}/{room?.num_questions}</div>
                  <div className="text-xs text-violet-400 font-mono">+{p.xp_earned} XP</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={leaveRoom}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  // Quiz screen
  if (screen === 'quiz' && room) {
    const q = room.questions[currentQ]
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-white">Multiplayer Quiz</h2>
            <p className="text-gray-400 text-sm">Topic: <span className="text-violet-400">{room.topic}</span></p>
          </div>
          <div className={`text-3xl font-black font-mono ${timeLeft <= 5 ? 'text-red-400' : 'text-yellow-400'}`}>
            {timeLeft}s
          </div>
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {participants.slice(0, 4).map(p => (
            <div key={p.user_id} className={`bg-gray-900 border rounded-xl p-2 text-center ${p.user_id === profile?.id ? 'border-violet-500/40' : 'border-gray-800'}`}>
              <div className="text-xs font-bold text-white truncate">{p.name}</div>
              <div className="text-sm font-black text-violet-400">{p.score}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-mono text-gray-500">Q {currentQ + 1}/{room.questions.length}</span>
          <div className="flex-1 bg-gray-800 rounded-full h-2">
            <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${((currentQ + 1) / room.questions.length) * 100}%` }} />
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${timeLeft <= 5 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            {timeLeft}
          </div>
        </div>

        {/* Question */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
          <p className="text-base font-bold text-white leading-relaxed mb-6">{q.q}</p>
          <div className="flex flex-col gap-3">
            {q.opts.map((opt, i) => {
              let cls = 'border-gray-700 bg-gray-800 hover:border-violet-500/50 cursor-pointer'
              if (answered) {
                if (i === q.ans) cls = 'border-teal-500 bg-teal-500/10 cursor-default'
                else if (i === selected) cls = 'border-red-500 bg-red-500/10 cursor-default'
                else cls = 'border-gray-700 bg-gray-800 opacity-40 cursor-default'
              }
              return (
                <div key={i} onClick={() => handleAnswer(i)} className={`px-4 py-3 rounded-xl border text-sm text-white transition-all ${cls}`}>
                  <span className="font-mono text-gray-400 mr-3">{String.fromCharCode(65 + i)}.</span>{opt}
                </div>
              )
            })}
          </div>
        </div>

        {answered && (
          <div className={`px-4 py-3 rounded-xl text-sm mb-4 ${selected === q.ans ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            {selected === q.ans ? '✓ Correct! ' : '✗ Not quite. '}{q.exp}
          </div>
        )}

        {isHost && answered && (
          <button onClick={nextQuestion} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all">
            {currentQ < room.questions.length - 1 ? 'Next Question →' : 'Finish Game 🏆'}
          </button>
        )}
        {!isHost && answered && (
          <div className="text-center text-gray-400 text-sm font-mono animate-pulse">Waiting for host to continue...</div>
        )}
      </div>
    )
  }

  // Waiting room
  if (screen === 'waiting' && room) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">Waiting Room</h2>
            <p className="text-gray-400 text-sm">Topic: <span className="text-violet-400">{room.topic}</span></p>
          </div>
          <button onClick={leaveRoom} className="text-gray-500 hover:text-red-400 text-sm transition-all">Leave</button>
        </div>

        {/* Room code */}
        <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-6 mb-6 text-center">
          <div className="text-xs text-yellow-400 font-mono uppercase tracking-wider mb-2">Room Code</div>
          <div className="text-5xl font-black text-white tracking-widest mb-2">{room.id}</div>
          <p className="text-gray-400 text-sm">Share this code with friends to join!</p>
          <button
            onClick={() => { navigator.clipboard.writeText(room.id); showToast('Code copied!', 'success') }}
            className="mt-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold px-4 py-2 rounded-xl text-sm transition-all hover:bg-yellow-500/20"
          >
            📋 Copy Code
          </button>
        </div>

        {/* Players */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <div className="text-xs text-gray-500 uppercase font-mono mb-3">Players ({participants.length})</div>
          <div className="flex flex-col gap-2">
            {participants.map(p => (
              <div key={p.user_id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center text-xs font-black">
                  {p.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 text-sm font-bold text-white">{p.name}</div>
                {p.user_id === room.host_id && (
                  <span className="text-xs text-yellow-400 font-mono bg-yellow-500/10 px-2 py-0.5 rounded-full">Host</span>
                )}
                {p.user_id === profile?.id && (
                  <span className="text-xs text-violet-400 font-mono bg-violet-500/10 px-2 py-0.5 rounded-full">You</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button
            onClick={startGame}
            disabled={participants.length < 1}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-black py-4 rounded-xl transition-all text-lg"
          >
            🚀 Start Game ({participants.length} player{participants.length !== 1 ? 's' : ''})
          </button>
        ) : (
          <div className="text-center text-gray-400 font-mono animate-pulse py-4">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    )
  }

  // Lobby
  return (
    <div className="w-full">
      <h2 className="text-2xl font-black text-white mb-1">Multiplayer Quiz 🎮</h2>
      <p className="text-gray-400 text-sm mb-6">Challenge your friends in real-time quiz battles!</p>

      <div className="grid grid-cols-2 gap-6">
        {/* Create room */}
        <div className={`bg-gray-900 border rounded-2xl p-6 transition-all ${screen === 'create' ? 'border-violet-500/40' : 'border-gray-800'}`}>
          <div className="text-xl font-black text-white mb-1">🏠 Create Room</div>
          <p className="text-gray-400 text-sm mb-4">Host a quiz for your friends</p>

          {screen !== 'create' ? (
            <button
              onClick={() => setScreen('create')}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all"
            >
              Create New Room
            </button>
          ) : (
            <div>
              <div className="mb-3">
                <label className="text-xs text-gray-400 font-mono mb-1 block">Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
                />
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-400 font-mono mb-1 block">Questions</label>
                <div className="flex gap-2">
                  {[5, 10, 15].map(n => (
                    <button
                      key={n}
                      onClick={() => setNumQuestions(n)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${numQuestions === n ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
                    >
                      {n} Qs
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={createRoom}
                disabled={generating || !topic.trim()}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
              >
                {generating ? '⏳ Generating...' : '🚀 Create Room'}
              </button>
            </div>
          )}
        </div>

        {/* Join room */}
        <div className={`bg-gray-900 border rounded-2xl p-6 transition-all ${screen === 'join' ? 'border-teal-500/40' : 'border-gray-800'}`}>
          <div className="text-xl font-black text-white mb-1">🚪 Join Room</div>
          <p className="text-gray-400 text-sm mb-4">Enter a room code to join</p>

          {screen !== 'join' ? (
            <button
              onClick={() => setScreen('join')}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-all"
            >
              Join Existing Room
            </button>
          ) : (
            <div>
              <div className="mb-4">
                <label className="text-xs text-gray-400 font-mono mb-1 block">Room Code</label>
                <input
                  type="text"
                  placeholder="e.g. ABC123"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-lg text-white placeholder-gray-500 outline-none focus:border-teal-500 text-center tracking-widest font-black"
                />
              </div>
              <button
                onClick={joinRoom}
                disabled={joinCode.length < 6}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
              >
                🚪 Join Room
              </button>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mt-6">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">How it works</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '🏠', text: 'Create a room and choose a topic' },
            { icon: '🔗', text: 'Share the room code with friends' },
            { icon: '⚡', text: 'Answer questions in real-time' },
            { icon: '🏆', text: 'See who gets the highest score!' },
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