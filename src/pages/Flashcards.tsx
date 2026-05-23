import { useState } from 'react'
import { showToast } from '../components/Toast'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
})

type Flashcard = {
  front: string
  back: string
  hint?: string
}

type Deck = {
  id: number
  topic: string
  cards: Flashcard[]
  createdAt: string
}

const STORAGE_KEY = 'learnxp_flashcard_decks'

const loadDecks = (): Deck[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

const saveDecks = (decks: Deck[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks))
}

export default function Flashcards() {
  const [decks, setDecks] = useState<Deck[]>(loadDecks)
  const [topic, setTopic] = useState('')
  const [numCards, setNumCards] = useState(10)
  const [generating, setGenerating] = useState(false)
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null)
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<number[]>([])
  const [unknown, setUnknown] = useState<number[]>([])
  const [finished, setFinished] = useState(false)

  const generateFlashcards = async () => {
    if (!topic.trim()) return
    setGenerating(true)
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Generate ${numCards} flashcards about "${topic}".
Return ONLY a valid JSON array like this:
[
  {
    "front": "Question or term",
    "back": "Answer or definition",
    "hint": "Optional short hint"
  }
]
Make them educational and concise. No markdown, just raw JSON.`
        }],
        temperature: 0.7,
        max_tokens: 2000,
      })

      const text = response.choices[0]?.message?.content || ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Invalid format')
      const cards = JSON.parse(jsonMatch[0])

      const newDeck: Deck = {
        id: Date.now(),
        topic: topic.trim(),
        cards,
        createdAt: new Date().toISOString(),
      }

      const updatedDecks = [newDeck, ...decks]
      setDecks(updatedDecks)
      saveDecks(updatedDecks)
      setTopic('')
      showToast(`Created ${cards.length} flashcards for "${topic}"!`, 'success')
    } catch {
      showToast('Failed to generate flashcards. Try again!', 'error')
    }
    setGenerating(false)
  }

  const startStudying = (deck: Deck) => {
    setActiveDeck(deck)
    setCardIndex(0)
    setFlipped(false)
    setKnown([])
    setUnknown([])
    setFinished(false)
  }

  const handleKnow = () => {
    setKnown(prev => [...prev, cardIndex])
    nextCard()
  }

  const handleDontKnow = () => {
    setUnknown(prev => [...prev, cardIndex])
    nextCard()
  }

  const nextCard = () => {
    if (!activeDeck) return
    setFlipped(false)
    if (cardIndex < activeDeck.cards.length - 1) {
      setTimeout(() => setCardIndex(i => i + 1), 150)
    } else {
      setFinished(true)
    }
  }

  const deleteDeck = (id: number) => {
    const updated = decks.filter(d => d.id !== id)
    setDecks(updated)
    saveDecks(updated)
    showToast('Deck deleted!', 'info')
  }

  // Finished screen
  if (finished && activeDeck) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center max-w-md w-full">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-white mb-2">Deck Complete!</h2>
          <p className="text-gray-400 mb-6">Topic: <span className="text-violet-400 font-bold">{activeDeck.topic}</span></p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-2xl font-black text-teal-400">{known.length}</div>
              <div className="text-xs text-gray-500 font-mono uppercase">Known ✓</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-2xl font-black text-red-400">{unknown.length}</div>
              <div className="text-xs text-gray-500 font-mono uppercase">To Review</div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-full h-3 mb-6">
            <div
              className="bg-teal-500 h-3 rounded-full transition-all"
              style={{ width: `${(known.length / activeDeck.cards.length) * 100}%` }}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => startStudying(activeDeck)}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all text-sm"
            >
              🔄 Study Again
            </button>
            <button
              onClick={() => setActiveDeck(null)}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all text-sm"
            >
              ← Back to Decks
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Studying screen
  if (activeDeck) {
    const card = activeDeck.cards[cardIndex]
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">Flashcards</h2>
            <p className="text-gray-400 text-sm">Topic: <span className="text-violet-400">{activeDeck.topic}</span></p>
          </div>
          <button
            onClick={() => setActiveDeck(null)}
            className="text-gray-500 hover:text-white text-sm transition-all"
          >
            ✕ Exit
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-xs font-mono text-gray-500">{cardIndex + 1} / {activeDeck.cards.length}</span>
          <div className="flex-1 bg-gray-800 rounded-full h-2">
            <div
              className="bg-violet-500 h-2 rounded-full transition-all"
              style={{ width: `${((cardIndex + 1) / activeDeck.cards.length) * 100}%` }}
            />
          </div>
          <div className="flex gap-2 text-xs font-mono">
            <span className="text-teal-400">✓ {known.length}</span>
            <span className="text-red-400">✗ {unknown.length}</span>
          </div>
        </div>

        {/* Flashcard */}
        <div
          onClick={() => setFlipped(f => !f)}
          className={`bg-gray-900 border rounded-2xl p-8 mb-6 cursor-pointer transition-all min-h-48 flex flex-col items-center justify-center text-center ${flipped ? 'border-teal-500/40' : 'border-gray-800 hover:border-violet-500/40'}`}
        >
          {!flipped ? (
            <div>
              <div className="text-xs text-gray-500 font-mono uppercase mb-4">Question / Term</div>
              <div className="text-xl font-bold text-white mb-4">{card.front}</div>
              {card.hint && (
                <div className="text-xs text-gray-500 italic">💡 Hint: {card.hint}</div>
              )}
              <div className="text-xs text-gray-600 mt-4 font-mono">Click to reveal answer</div>
            </div>
          ) : (
            <div>
              <div className="text-xs text-teal-400 font-mono uppercase mb-4">Answer</div>
              <div className="text-lg font-bold text-white">{card.back}</div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {flipped ? (
          <div className="flex gap-3">
            <button
              onClick={handleDontKnow}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold py-3 rounded-xl transition-all"
            >
              ✗ Still Learning
            </button>
            <button
              onClick={handleKnow}
              className="flex-1 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400 font-bold py-3 rounded-xl transition-all"
            >
              ✓ Got It!
            </button>
          </div>
        ) : (
          <button
            onClick={() => setFlipped(true)}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            Reveal Answer →
          </button>
        )}
      </div>
    )
  }

  // Main screen
  return (
    <div className="w-full">
      <h2 className="text-2xl font-black text-white mb-1">AI Flashcards 🃏</h2>
      <p className="text-gray-400 text-sm mb-6">Generate flashcards on any topic and study smarter!</p>

      {/* Generator */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-4">🤖 Generate Flashcards</div>

        <div className="mb-4">
          <label className="text-xs text-gray-400 font-mono mb-2 block">Topic</label>
          <input
            type="text"
            placeholder="e.g. Photosynthesis, Python, World War 2..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateFlashcards()}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
          />
        </div>

        <div className="mb-5">
          <label className="text-xs text-gray-400 font-mono mb-2 block">Number of Cards</label>
          <div className="flex gap-2 flex-wrap">
            {[5, 10, 15, 20].map(n => (
              <button
                key={n}
                onClick={() => setNumCards(n)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${numCards === n
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
                }`}
              >
                {n} Cards
              </button>
            ))}
            <input
              type="number"
              min={3}
              max={30}
              value={numCards}
              onChange={e => setNumCards(Math.min(30, Math.max(3, parseInt(e.target.value) || 10)))}
              className="w-20 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white text-center outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <button
          onClick={generateFlashcards}
          disabled={generating || !topic.trim()}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-sm"
        >
          {generating ? `⏳ Generating ${numCards} flashcards...` : '✨ Generate Flashcards'}
        </button>
      </div>

      {/* Saved decks */}
      {decks.length === 0 ? (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🃏</div>
          <div className="text-white font-bold mb-1">No flashcard decks yet</div>
          <div className="text-gray-400 text-sm">Generate your first deck above!</div>
        </div>
      ) : (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Your Decks</div>
          <div className="grid grid-cols-2 gap-4">
            {decks.map(deck => (
              <div key={deck.id} className="bg-gray-900 border border-gray-800 hover:border-violet-500/30 rounded-2xl p-5 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-white text-sm mb-1">{deck.topic}</div>
                    <div className="text-xs text-gray-500 font-mono">
                      {deck.cards.length} cards · {new Date(deck.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteDeck(deck.id)}
                    className="text-gray-600 hover:text-red-400 transition-all text-sm"
                  >
                    🗑️
                  </button>
                </div>
                <button
                  onClick={() => startStudying(deck)}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 rounded-xl transition-all text-xs"
                >
                  📖 Study Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}