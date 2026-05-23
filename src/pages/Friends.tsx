import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'

type Profile = {
  id: string
  name: string
  xp: number
  level: number
  streak: number
}

type Friend = {
  id: string
  user_id: string
  friend_id: string
  status: string
  profile: Profile
}

export default function Friends() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingReceived, setPendingReceived] = useState<Friend[]>([])
  const [pendingSent, setPendingSent] = useState<Friend[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends')

  useEffect(() => {
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUser(user.id)
    await loadFriends(user.id)
    setLoading(false)
  }

  const loadFriends = async (userId: string) => {
    const { data } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)

    if (!data) return

    const accepted: Friend[] = []
    const received: Friend[] = []
    const sent: Friend[] = []

    for (const f of data) {
      const otherId = f.user_id === userId ? f.friend_id : f.user_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, xp, level, streak')
        .eq('id', otherId)
        .single()

      if (!profile) continue
      const friend = { ...f, profile }

      if (f.status === 'accepted') {
        accepted.push(friend)
      } else if (f.status === 'pending') {
        if (f.friend_id === userId) {
          received.push(friend)
        } else {
          sent.push(friend)
        }
      }
    }

    setFriends(accepted)
    setPendingReceived(received)
    setPendingSent(sent)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentUser) return
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, name, xp, level, streak')
      .ilike('name', `%${searchQuery}%`)
      .neq('id', currentUser)
      .limit(10)

    setSearchResults(data || [])
    setSearching(false)
  }

  const sendFriendRequest = async (friendId: string) => {
    if (!currentUser) return
    const { error } = await supabase
      .from('friends')
      .insert({ user_id: currentUser, friend_id: friendId, status: 'pending' })

    if (error) {
      showToast('Already sent a request!', 'error')
    } else {
      showToast('Friend request sent! 🎉', 'success')
      await loadFriends(currentUser)
    }
  }

  const acceptRequest = async (friendId: string) => {
    if (!currentUser) return
    await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('user_id', friendId)
      .eq('friend_id', currentUser)

    showToast('Friend request accepted! 🎉', 'success')
    await loadFriends(currentUser)
  }

  const declineRequest = async (friendId: string) => {
    if (!currentUser) return
    await supabase
      .from('friends')
      .delete()
      .eq('user_id', friendId)
      .eq('friend_id', currentUser)

    showToast('Request declined', 'info')
    await loadFriends(currentUser)
  }

  const removeFriend = async (friendId: string) => {
    if (!currentUser) return
    await supabase
      .from('friends')
      .delete()
      .or(`and(user_id.eq.${currentUser},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser})`)

    showToast('Friend removed', 'info')
    await loadFriends(currentUser)
  }

  const isAlreadyFriend = (id: string) =>
    friends.some(f => f.profile.id === id) ||
    pendingSent.some(f => f.profile.id === id) ||
    pendingReceived.some(f => f.profile.id === id)

  const levelLabels = ['Beginner', 'Student', 'Scholar', 'Expert', 'Master', 'Legend']

  const ProfileCard = ({ profile, actions }: { profile: Profile, actions: React.ReactNode }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center font-black text-sm flex-shrink-0">
        {profile.name?.slice(0, 2).toUpperCase() || 'ST'}
      </div>
      <div className="flex-1">
        <div className="font-bold text-white text-sm">{profile.name || 'Student'}</div>
        <div className="text-xs text-gray-400 font-mono">
          Level {profile.level} · {levelLabels[Math.min((profile.level || 1) - 1, 5)]}
        </div>
        <div className="flex gap-3 mt-1 text-xs text-gray-500 font-mono">
          <span className="text-violet-400">⚡ {profile.xp?.toLocaleString() || 0} XP</span>
          <span className="text-yellow-400">🔥 {profile.streak || 0} streak</span>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">{actions}</div>
    </div>
  )

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <div className="text-violet-400 animate-pulse font-mono">Loading friends...</div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-black text-white mb-1">Friends & Social 👥</h2>
      <p className="text-gray-400 text-sm mb-6">Connect with fellow students and compete together!</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: '👥', label: 'Friends', value: friends.length, color: 'text-violet-400' },
          { icon: '📨', label: 'Requests', value: pendingReceived.length, color: 'text-yellow-400' },
          { icon: '📤', label: 'Sent', value: pendingSent.length, color: 'text-teal-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className={`text-xl mb-1 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-black text-white mb-1">{s.value}</div>
            <div className="text-xs text-gray-500 uppercase font-mono">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'friends', label: `Friends (${friends.length})` },
          { key: 'requests', label: `Requests (${pendingReceived.length})` },
          { key: 'search', label: '🔍 Find Friends' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key
              ? 'bg-violet-600 text-white'
              : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Friends tab */}
      {activeTab === 'friends' && (
        <div>
          {friends.length === 0 ? (
            <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">👥</div>
              <div className="text-white font-bold mb-1">No friends yet!</div>
              <div className="text-gray-400 text-sm mb-4">Search for students and send friend requests</div>
              <button
                onClick={() => setActiveTab('search')}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
              >
                🔍 Find Friends
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {friends.map(f => (
                <ProfileCard
                  key={f.id}
                  profile={f.profile}
                  actions={
                    <button
                      onClick={() => removeFriend(f.profile.id)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-lg text-xs transition-all"
                    >
                      Remove
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requests tab */}
      {activeTab === 'requests' && (
        <div>
          {pendingReceived.length === 0 && pendingSent.length === 0 ? (
            <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">📨</div>
              <div className="text-white font-bold mb-1">No pending requests</div>
              <div className="text-gray-400 text-sm">Friend requests will appear here</div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pendingReceived.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 uppercase font-mono mb-3">Received Requests</div>
                  <div className="flex flex-col gap-3">
                    {pendingReceived.map(f => (
                      <ProfileCard
                        key={f.id}
                        profile={f.profile}
                        actions={
                          <>
                            <button
                              onClick={() => acceptRequest(f.profile.id)}
                              className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400 font-bold rounded-lg text-xs transition-all"
                            >
                              ✓ Accept
                            </button>
                            <button
                              onClick={() => declineRequest(f.profile.id)}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-lg text-xs transition-all"
                            >
                              ✗ Decline
                            </button>
                          </>
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {pendingSent.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 uppercase font-mono mb-3">Sent Requests</div>
                  <div className="flex flex-col gap-3">
                    {pendingSent.map(f => (
                      <ProfileCard
                        key={f.id}
                        profile={f.profile}
                        actions={
                          <span className="text-xs text-yellow-400 font-mono bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg">
                            Pending...
                          </span>
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search tab */}
      {activeTab === 'search' && (
        <div>
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold px-5 py-3 rounded-xl transition-all"
            >
              {searching ? '⏳' : '🔍 Search'}
            </button>
          </div>

          {searchResults.length === 0 && searchQuery && !searching ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">😕</div>
              <div className="text-sm">No users found for "{searchQuery}"</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {searchResults.map(profile => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  actions={
                    isAlreadyFriend(profile.id) ? (
                      <span className="text-xs text-gray-400 font-mono bg-gray-800 px-3 py-1.5 rounded-lg">
                        {friends.some(f => f.profile.id === profile.id) ? '✓ Friends' : '📤 Sent'}
                      </span>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(profile.id)}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg text-xs transition-all"
                      >
                        + Add Friend
                      </button>
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}